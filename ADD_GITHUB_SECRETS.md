# 🔑 ADD THESE 4 GITHUB SECRETS NOW

## Go to GitHub Secrets Page
https://github.com/mbienaimee/Capstone-PatientPassport/settings/secrets/actions

---

## ✅ ADD THESE 4 NEW SECRETS (Click "New repository secret" for each)

### 1. AZURE_CLIENT_ID
```
8ef7b427-0917-481c-aee1-65eee96b29f4
```

### 2. AZURE_TENANT_ID
```
6af129fa-a02a-4303-bd2f-603ddd73c67d
```

### 3. AZURE_SUBSCRIPTION_ID
```
736b4173-e1ed-46ae-be69-2241d0f855e8
```

### 4. AZURE_RESOURCE_GROUP
```
passportpatient_group-364
```

---

## 🗑️ DELETE THESE OLD SECRETS (Optional but recommended)

After adding the new ones, you can delete these old secrets that are no longer used:

- ❌ `CLIENTID` (replaced by AZURE_CLIENT_ID)
- ❌ `TENANTID` (replaced by AZURE_TENANT_ID)
- ❌ `SUBSCRIPTIONID` (replaced by AZURE_SUBSCRIPTION_ID)
- ❌ `CLIENTSECRET` (not needed with OIDC)
- ❌ `AZUREAPPSERVICE_CLIENTID_91056519DD7F4A2F986CBC49EEBF8553` (auto-generated, not used)
- ❌ `AZUREAPPSERVICE_TENANTID_EF97F0EC5FF346DDA6A50509B60EC278` (auto-generated, not used)
- ❌ `AZUREAPPSERVICE_SUBSCRIPTIONID_5003280868E84F909999D3A50199FDCA` (auto-generated, not used)
- ❌ `AZURE_CREDENTIALS` (old format, not used)
- ❌ `ACTIVEDIRECTORYENDPOINTURL` (not needed)

---

## 📝 How to Add a Secret in GitHub

1. Click **"New repository secret"**
2. Enter the **Name** (exactly as shown above, e.g., `AZURE_CLIENT_ID`)
3. Paste the **Value** (copy from above)
4. Click **"Add secret"**
5. Repeat for all 4 secrets

---

## ✅ Final Check

After adding all 4 secrets, your secrets page should have:

Required secrets:
- ✅ AZURE_CLIENT_ID
- ✅ AZURE_TENANT_ID
- ✅ AZURE_SUBSCRIPTION_ID
- ✅ AZURE_RESOURCE_GROUP

---

## 🚀 Then Test the Deployment

```bash
git push origin main
```

Monitor at: https://github.com/mbienaimee/Capstone-PatientPassport/actions

---

## 🎯 Quick Copy-Paste Reference

```
Name: AZURE_CLIENT_ID
Value: 8ef7b427-0917-481c-aee1-65eee96b29f4

Name: AZURE_TENANT_ID
Value: 6af129fa-a02a-4303-bd2f-603ddd73c67d

Name: AZURE_SUBSCRIPTION_ID
Value: 736b4173-e1ed-46ae-be69-2241d0f855e8

Name: AZURE_RESOURCE_GROUP
Value: passportpatient_group-364
```

---

**Do this now, then push your code!** 🚀
