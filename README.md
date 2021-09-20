# Node.js upload File to Google Cloud Storage

## Project setup
```
npm install
```

### Run locally in Windows/Linux
```
export GOOGLE_STORAGE_KEY=`cat keys/google-cloud-key.json`
node server.js
```

### Deploy in GCP Cloud Run
```
Create a GCP Storage bucket with name "healthcare-records"
Create a Service Account for with Storage Admin preveleges and save it to a file
Secret Manager: Create a secret with name GOOGLE_STORAGE_KEY and upload the Service Account for the GCP Storage
Cloud Run: Create a service (add an Environment variable with name GOOGLE_STORAGE_KEY pointing to the secret with the same name)
```





# off-chain-server
