package handler

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

type ServiceAccount struct {
	ClientEmail string `json:"client_email"`
	PrivateKey  string `json:"private_key"`
	TokenURI    string `json:"token_uri"`
}

type SheetCache struct {
	mu          sync.RWMutex
	lastFetched time.Time
	payload     map[string][][]string
}

var cache = &SheetCache{
	payload: make(map[string][][]string),
}

// Handler serves /api/dashboard on Vercel Serverless using Service Account credentials from .env
func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	spreadsheetID := os.Getenv("SPREADSHEET_ID")
	if spreadsheetID == "" {
		spreadsheetID = os.Getenv("GOOGLE_SPREADSHEET_ID")
	}
	forceRefresh := r.URL.Query().Get("refresh") == "true"

	if spreadsheetID == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"mode":    "dummy",
			"status":  "ok",
			"message": "SPREADSHEET_ID belum diset di Environment Variables.",
		})
		return
	}

	cache.mu.RLock()
	isFresh := time.Since(cache.lastFetched) < 30*time.Second && len(cache.payload) > 0
	cache.mu.RUnlock()

	if !isFresh || forceRefresh {
		sa, err := loadServiceAccount()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"mode":    "error",
				"status":  "error",
				"message": fmt.Sprintf("Gagal membaca Service Account: %v", err),
			})
			return
		}

		token, err := getAccessToken(sa)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"mode":    "error",
				"status":  "error",
				"message": fmt.Sprintf("Gagal autentikasi OAuth2: %v", err),
			})
			return
		}

		financeSheet := getEnvOrDefault("FINANCE_SHEET", "finance")
		closingSheet := getEnvOrDefault("WORKSHEET_NAME", "closing")
		leadsSheet := getEnvOrDefault("LEADS_RAW_WORKSHEET", "leads")

		sheetsData, err := fetchBatchSheets(spreadsheetID, token, financeSheet, closingSheet, leadsSheet)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"mode":    "error",
				"status":  "error",
				"message": fmt.Sprintf("Gagal mengambil batch Google Sheets: %v", err),
			})
			return
		}

		cache.mu.Lock()
		cache.payload = sheetsData
		cache.lastFetched = time.Now()
		cache.mu.Unlock()
	}

	cache.mu.RLock()
	defer cache.mu.RUnlock()

	json.NewEncoder(w).Encode(map[string]interface{}{
		"mode":        "google_sheets",
		"status":      "ok",
		"lastUpdated": cache.lastFetched.Format(time.RFC3339),
		"sheets":      cache.payload,
	})
}

func getEnvOrDefault(key, def string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	return v
}

func loadServiceAccount() (*ServiceAccount, error) {
	b64 := strings.TrimSpace(os.Getenv("SERVICE_ACCOUNT_JSON_B64"))
	var raw []byte
	var err error

	if b64 != "" && !strings.HasSuffix(b64, "...") {
		raw, err = base64.StdEncoding.DecodeString(b64)
		if err != nil {
			return nil, err
		}
	} else {
		saPath := getEnvOrDefault("SERVICE_ACCOUNT_JSON_PATH", "service_account.json")
		raw, err = os.ReadFile(saPath)
		if err != nil {
			return nil, err
		}
	}

	var sa ServiceAccount
	if err := json.Unmarshal(raw, &sa); err != nil {
		return nil, err
	}
	if sa.TokenURI == "" {
		sa.TokenURI = "https://oauth2.googleapis.com/token"
	}
	return &sa, nil
}

func getAccessToken(sa *ServiceAccount) (string, error) {
	headerJSON := `{"alg":"RS256","typ":"JWT"}`
	now := time.Now().Unix()
	claimMap := map[string]interface{}{
		"iss":   sa.ClientEmail,
		"scope": "https://www.googleapis.com/auth/spreadsheets.readonly",
		"aud":   sa.TokenURI,
		"exp":   now + 3600,
		"iat":   now,
	}
	claimBytes, _ := json.Marshal(claimMap)

	headerB64 := base64.RawURLEncoding.EncodeToString([]byte(headerJSON))
	claimB64 := base64.RawURLEncoding.EncodeToString(claimBytes)
	signingInput := headerB64 + "." + claimB64

	block, _ := pem.Decode([]byte(sa.PrivateKey))
	if block == nil {
		return "", fmt.Errorf("invalid private key PEM")
	}

	parsedKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return "", err
	}
	rsaKey, ok := parsedKey.(*rsa.PrivateKey)
	if !ok {
		return "", fmt.Errorf("not an RSA private key")
	}

	hashed := sha256.Sum256([]byte(signingInput))
	sig, err := rsa.SignPKCS1v15(rand.Reader, rsaKey, crypto.SHA256, hashed[:])
	if err != nil {
		return "", err
	}

	jwt := signingInput + "." + base64.RawURLEncoding.EncodeToString(sig)

	form := url.Values{}
	form.Set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer")
	form.Set("assertion", jwt)

	resp, err := http.PostForm(sa.TokenURI, form)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("token status %d: %s", resp.StatusCode, string(body))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", err
	}
	return tokenResp.AccessToken, nil
}

func fetchBatchSheets(spreadsheetID, token, financeSheet, closingSheet, leadsSheet string) (map[string][][]string, error) {
	u := fmt.Sprintf(
		"https://sheets.googleapis.com/v4/spreadsheets/%s/values:batchGet?ranges=%s&ranges=%s&ranges=%s",
		spreadsheetID,
		url.QueryEscape(financeSheet+"!A1:P50000"),
		url.QueryEscape(closingSheet+"!A1:T50000"),
		url.QueryEscape(leadsSheet+"!A1:M50000"),
	)

	req, _ := http.NewRequest("GET", u, nil)
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("sheets status %d: %s", resp.StatusCode, string(body))
	}

	var batchResp struct {
		ValueRanges []struct {
			Values [][]string `json:"values"`
		} `json:"valueRanges"`
	}
	if err := json.Unmarshal(body, &batchResp); err != nil {
		return nil, err
	}

	res := map[string][][]string{
		"finance": {},
		"closing": {},
		"leads":   {},
	}
	if len(batchResp.ValueRanges) > 0 {
		res["finance"] = batchResp.ValueRanges[0].Values
	}
	if len(batchResp.ValueRanges) > 1 {
		res["closing"] = batchResp.ValueRanges[1].Values
	}
	if len(batchResp.ValueRanges) > 2 {
		res["leads"] = batchResp.ValueRanges[2].Values
	}
	return res, nil
}
