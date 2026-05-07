# Push Docker images to Aliyun registry

# Configuration
$registry = "crpi-5gf9izcbddfhjjvc.cn-hangzhou.personal.cr.aliyuncs.com"
$namespace = "leigod"
$tag = "latest"

# Login to Aliyun registry
Write-Host "Logging in to Aliyun registry..."
docker login $registry

if ($LASTEXITCODE -ne 0) {
    Write-Host "Login failed, please check error message" -ForegroundColor Red
    exit 1
}

# Build and push backend image
Write-Host "Building backend Docker image..." -ForegroundColor Cyan
Push-Location .\backend
docker build -t "bachelor-backend:latest" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build failed, please check error message" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Tag image
$backendImage = "$registry/$namespace/bachelor-backend:$tag"
Write-Host "Tagging backend image as $backendImage..."
docker tag "bachelor-backend:latest" "$backendImage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend tagging failed, please check error message" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Push image
Write-Host "Pushing backend image to Aliyun registry..."
docker push "$backendImage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend push failed, please check error message" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "Backend image pushed successfully! Image address: $backendImage" -ForegroundColor Green
Pop-Location

# Build and push frontend image
Write-Host "Building frontend Docker image..." -ForegroundColor Cyan

# 从环境变量读取百度地图AK
$baiduMapAK = $env:VITE_BAIDU_MAP_AK

if ([string]::IsNullOrEmpty($baiduMapAK)) {
    Write-Host "error：No baidu map ak provided, please set environment variable VITE_BAIDU_MAP_AK manually" -ForegroundColor Red
    Write-Host "Please use the following command to set environment variable:" -ForegroundColor Yellow
    Write-Host "  [System.Environment]::SetEnvironmentVariable('VITE_BAIDU_MAP_AK', '你的AK', 'User')" -ForegroundColor Yellow
    Write-Host "After setting, please restart PowerShell window" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using baidu map ak: $baiduMapAK" -ForegroundColor Cyan
Push-Location .\frontend
docker build --build-arg VITE_BAIDU_MAP_AK="$baiduMapAK" -t "bachelor-frontend:latest" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed, please check error message" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Tag image
$frontendImage = "$registry/$namespace/bachelor-frontend:$tag"
Write-Host "Tagging frontend image as $frontendImage..."
docker tag "bachelor-frontend:latest" "$frontendImage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend tagging failed, please check error message" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Push image
Write-Host "Pushing frontend image to Aliyun registry..."
docker push "$frontendImage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend push failed, please check error message" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "Frontend image pushed successfully! Image address: $frontendImage" -ForegroundColor Green
Pop-Location

Write-Host "All images pushed successfully!" -ForegroundColor Green
Write-Host "Backend image: $backendImage" -ForegroundColor Yellow
Write-Host "Frontend image: $frontendImage" -ForegroundColor Yellow