import { Page, expect } from '@playwright/test';

export async function createCustomerForm(page, username, cellphone, email) { 
  await page.waitForSelector('#username', { timeout: 60000 });// Mở trang đăng ký
  await page.fill('#username', username);          // Nhập tên
  await page.fill('#cellphone', cellphone);        // Nhập số điện thoại
  await page.fill('#email', email);                // Nhập email
  await page.locator('button[type="submit"]').click(); // Submit form
  await page.waitForTimeout(2000); 
  // chờ 2 giây
}

export async function checkProfile(page:Page, email:string, user_name?: string){
  await page.locator('a[href="/profile"]').click();
  await page.waitForTimeout(2000);
  const email_confirm = page.getByText(email, { exact: true });
  // await expect(page.getByText(user_name!)).toHaveText(user_name!);
  //await expect(email_confirm).toBeVisible();
} 

export async function addInforCustomer (page:Page,email_customer:string,customer_name1: string, customer_name2:string, postcode3: string,  
  postcode4:string, address2:string,addess3: string, telephone: string){

  await page.locator('#customer_name1').click();
  await page.locator('#customer_name1').fill(customer_name1);
  await page.locator('#customer_name2').fill(customer_name2);
  await page.locator('#email').nth(1).fill(email_customer);
  await page.locator('#postcode3').fill(postcode3.toString());
  await page.locator('#postcode4').fill(postcode4.toString());
  await page.getByRole('button', { name :'自動入力する'}).click();
  await page.waitForTimeout(3000);
  await page.locator('#address2').fill(address2);
  await page.locator('#address3').fill(addess3);
  await page.locator('#telephone').fill(telephone);
  await page.locator('input[name="billing_classification"]').check();
  await page.getByRole('button', { name: '送信する' }).click();
}
