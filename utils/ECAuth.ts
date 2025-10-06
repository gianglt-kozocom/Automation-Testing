import { APIRequestContext, Page } from '@playwright/test';

export async function confirmAccount(
  request: APIRequestContext, 
  baseUrl: string, 
  username: string, 
  cellphone: string, 
  email: string, 
  customerHashId?: string | null
){
  const url = new URL(`${baseUrl}/api/v1/auth/account/confirm`);
  
  // Nếu có customer_hash_id thì thêm vào query string
  if (customerHashId) {
    url.searchParams.set('customer_hash_id', customerHashId);
  }

  const res = await request.post(url.toString(), {
    data: { username, cellphone, email, type: 'normal' },
  });

  if (!res.ok()) {
    throw new Error(`API confirmAccount failed: ${res.status()}`);
  }
  
  const data = await res.json();
  console.log('API Response:', data);
  console.log("Code:", data.code) // In ra toàn bộ phản hồi từ API
  if (!data.code) {
    throw new Error('API response missing verification code');
  }

  return data.code;
  }


export async function verifyCode(page: Page, code: any) {
  try {
      console.log('Filled code:', code);
      await page.fill('#code', code); // Nhập mã code
      const [verifyRes] = await Promise.all([
        page.waitForResponse(res =>
          res.url().includes('/api/v1/auth/verify') && res.status() === 200
        ),
        page.locator('button[type="submit"]').click() // Click verify trên UI
      ]);

      const verifyData = await verifyRes.json();
      return verifyData.data?.approval_token; // Trả về approval token
  } catch (error) {
    console.log(error);
  }
}

export async function registerPassword(page: Page, approval_token: any) {
  await page.fill('#password','Test123@');               // Nhập password
  await page.fill('#password_confirmation','Test123@');  // Nhập confirm password
  const [regResp] = await Promise.all([
    page.waitForResponse(resp =>
      resp.url().includes('/api/v1/auth/password/registration') && resp.status() === 200
    ),
    page.locator('button[type="submit"]').click() // Submit password
  ]);
  const regData = await regResp.json();
  return regData.token || regData.access_token; // Trả về token để gọi API khác
}


export async function getMe(request: APIRequestContext, baseUrl: string, token: any) {
  const meResp = await request.get(`${baseUrl}/api/v1/profiles/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meResp.ok()) {
    throw new Error(`API /profiles/me failed: ${meResp.status()}`);
  }
  const meData = await meResp.json();
  return {
    customerCode: meData.data?.customer_code, // Mã khách hàng 8 số
    status: meData.data?.status,              // Trạng thái tài khoản
    meData                                    // Toàn bộ dữ liệu profile
  };
}


export async function loginEC(page: Page, email: string, password: string) {
  await page.goto("https://dev02.ec-vegekul.scoregre.com/login");
  await page.fill('#email',email);               // Nhập password
  await page.fill('#password',password);  // Nhập confirm password
  const [regResp] = await Promise.all([
    page.waitForResponse(resp =>
      resp.url().includes('/api/v1/auth/login') && resp.status() === 200
    ),
    page.locator('button[type="submit"]').click() // Submit password
  ]);
  const regData = await regResp.json();
  return regData.token || regData.access_token; // Trả về token để gọi API khác
}

export async function loginInviteUI(
  page: Page,
  password: string
) {
  await page.fill("#password", password);
  const [regResp] = await Promise.all([
    page.waitForResponse(resp =>
      resp.url().includes("/api/v1/auth/login-invite") && resp.status() === 200
    ),
    page.getByRole('button', {name:'ログインする'}).click()
  ]);

  const regData = await regResp.json();
  return regData.token || regData.access_token;
}
