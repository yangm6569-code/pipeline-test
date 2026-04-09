# New API 出图用法（OpenAI 兼容）

脚本位置：

- `docs/prototype/newapi_generate.py`

## 1) 配置环境变量（PowerShell）

```powershell
$env:NEWAPI_API_KEY="你的 sk-xxxx"
$env:NEWAPI_BASE_URL="你的 new api 地址，例如 https://your-domain.com/v1"
$env:NEWAPI_IMAGE_MODEL="你的图片模型名"
```

说明：

- `NEWAPI_BASE_URL` 建议写到 `.../v1`，脚本也会自动兼容没写 `/v1` 的情况。
- 脚本默认请求 `POST /images/generations`。

## 2) 直接生成原型图

```powershell
python docs/prototype/newapi_generate.py "A WEB-BASED ADMIN DASHBOARD WIREFRAME for a university research management system in Modao style, low-fidelity, grayscale, Chinese SaaS admin UI, include login dashboard project approval reimbursement user role modules" --output images --size 1536x1024
```

成功后会输出图片路径，比如：

- `images/newapi-image-20260327-130000.png`

## 3) 可选参数

```powershell
python docs/prototype/newapi_generate.py "your prompt" --model gpt-image-1 --quality high --filename modao-prototype.png --save-response docs/prototype/newapi-last-response.json
```

## 4) 常见报错

- `401/403`：`API Key` 或 `base_url` 不匹配。
- `404`：服务商不支持 `/images/generations` 或路径不是 `/v1`。
- `429`：额度或频率限制。
