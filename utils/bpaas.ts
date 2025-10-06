import { APIRequestContext, Page, expect } from '@playwright/test';



export async function loginBpaaS(page: Page, baseURL: string, request){
  await page.goto("https://dev02.bpaas-vegekul.scoregre.com/login");
  await page.fill('#email','admin@admin.com');
  await page.fill('#password','secret');
  await page.waitForTimeout(2000); 
  const [regResp] = await Promise.all([
  page.waitForResponse(resp =>
    resp.url().includes('/api/v1/auth/login') && resp.status() === 200
  ),
  page.locator('button[type="submit"]').click() // Submit password
  ]);
  const data = await regResp.json();
  console.log(data)
  const token = data.token;
  return token;
}

export async function createCustomer(page: Page, customer_code: string, customer_name2: string, email: string) {
    await page.getByText('得意先を追加').click();
    await page.fill('#customer_code', customer_code);
    await page.locator(`(//input[@id='customer_name2'])[2]`).fill(customer_name2);
    //await page.fill('#customer_name2', customer_name2);
    await page.fill('#email', email);
    await page.waitForTimeout(1000); 
     const [regResp] = await Promise.all([
    page.waitForResponse(resp =>
      resp.url().includes('/api/v1/customers') && resp.status() === 201
    ),
    page.getByRole('button', { name: '登録' }).click()
  ]);
  const regData = await regResp.json();
  return {
    customerCode: regData.data?.customer_code, // Mã khách hàng 8 số
    status: regData.data?.status,   
    customerName2: regData.data?.customer_name2,
    customerEmail: regData.data?.email, 
    customerID: regData.data?.id,    // Trạng thái tài khoản
    regData                                    // Toàn bộ dữ liệu profile
  };
}

export async function linkPartnerCousrse(page: Page){
  await page.locator('button:has-text("パートナーの選択")').click();
  await page.locator('[name="inputSearch"]').click();
  await page.locator('button:has-text("2001　Pam 2001") input[type="checkbox"]').check();
  await page.waitForTimeout(1000);
  // Click vào body hoặc một vùng trống
  await page.locator('body').click();
  await page.locator('[placeholder="選択してください"]').nth(6).click();
  await page.locator('span.text-text-tertiary').click();
  await page.getByRole('button', { name: 'アップデート' }).click();
}

export async function updateCustomer(page) {
    await page.fill('#postal_code','100-0005');
    await page.waitForTimeout(2000);
    await page.fill('#address2','DN');
    await page.fill('#address3','06 Nguyen Van Linh');
    await page.fill('#telephone','0368057333');
    //link partner course
    await linkPartnerCousrse(page);
    // update customer
    await page.getByRole('button', { name: 'アップデート' }).click();
    await page.waitForTimeout(2000); 
}

export async function getURLRegistered(customerID: any, baseUrl: string, token: any, request: APIRequestContext){
  const res = await request.get(`${baseUrl}/api/v1/master-data/customers/url-login-ec/${customerID}`, {
  headers: {
  Authorization: `Bearer ${token}`, // nếu cần
  },
  });
  const {data} = await res.json();
  console.log(`Res:${res}`);
  console.log('Flyer URL:', data);
 
  if (!data.ec_url_login) {
    throw new Error('Failed to get flyer URL from API');
  }
  const URL = data.ec_url_login;
  return URL;
}

