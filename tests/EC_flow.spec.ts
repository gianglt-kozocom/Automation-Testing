import { test, expect, APIRequestContext, Page } from '@playwright/test';
import { createCustomerForm, checkProfile, addInforCustomer} from '../utils/uiEC.ts';
import { confirmAccount, verifyCode, registerPassword, getMe, loginEC, loginInviteUI } from '../utils/ECAuth.ts';
import { loginBpaaS, createCustomer, updateCustomer, getURLRegistered } from '../utils/bpaas.ts';
import { extractHashIdFromUrl } from '../utils/helpers.ts';
import { testData } from "../data/testData";
function generateSignUpData() {
  const timestamp = Date.now();
  return {
    username: `Pam_${timestamp}`,
    cellphone: '09864737273',
    email: `pam_customer_${timestamp}@gmail.com`,
  };
}  
function generateDynamicData (){
  const timestamp = Date.now();
  const customerCode = `1${timestamp}`;
  return customerCode;
}
test("Sign up customer", async () => {
  console.log("Base URL:", testData.config.baseURL_ec);
  console.log("Account Exist:", testData.accountExisted.email_account);
  console.log("Random SignUp Email:", testData.signUp.email);
});

test("TC1: Register customer with email haven't already exist -- status 'ec_temporary_register' ", async ({ page, request }) => {
  const baseUrl = testData.config.apiEC;
  const signUpData = generateSignUpData()
  const { username, cellphone, email } = signUpData;
  await page.goto('https://dev02.ec-vegekul.scoregre.com/signup');
  await createCustomerForm(page, username, cellphone, email);

  // 2️⃣ Gọi API confirm account để lấy verification code
  const code = await confirmAccount(request, baseUrl, username, cellphone, email);
  console.log('Verification Code:', code); 

  // 3️⃣ Submit code và lấy approval_token
  const approval_token = await verifyCode(page, code);

  // 4️⃣ Đăng ký password và lấy token
  const token = await registerPassword(page, approval_token);

  // 5️⃣ Lấy thông tin customer từ API /profiles/me
  const { customerCode, status } = await getMe(request, baseUrl, token);

  console.log('Customer Code:', customerCode);
  console.log('Status:', status);
  expect(status).toBe('ec_temporary_register');
  expect(customerCode).toMatch(/^\d{8}$/);
  await page.waitForTimeout(2000); 
  await expect(page.locator('#full_name')).toHaveValue(username);// VD: active
  await expect(page.locator('#cellphone')).toHaveValue(cellphone);
  expect(page.getByRole('textbox', { name: email }).nth(1));
  await page.locator('a[href="/profile"]').click();
  await page.waitForTimeout(2000);
  // Kiểm tra có hiển thị button add infor 
  expect (page.getByText('店舗情報追加')).toBeVisible();
  //Kiểm tra có hiển thị button invite_staff
  //expect (page.getByText('スタッフ招待')).toBeVisible();
});
test("TC2: Register customer with email haven't already exist -- status 'pre_transaction' ", async ({ page, request }) => {
  const baseUrl = testData.config.apiEC;
  const signUpData = generateSignUpData();
  const { username, cellphone, email } = signUpData;
  await page.goto('https://dev02.ec-vegekul.scoregre.com/signup');
  await createCustomerForm(page, username, cellphone, email);

  // 2️⃣ Gọi API confirm account để lấy verification code
  const code = await confirmAccount(request, baseUrl, username, cellphone, email);
  console.log('Verification Code:', code); 

  // 3️⃣ Submit code và lấy approval_token
  const approval_token = await verifyCode(page, code);

  // 4️⃣ Đăng ký password và lấy token
  const token = await registerPassword(page, approval_token);
  // Check thôgn tin customer trên UI có match với thông tin đã đăng ký
  await expect(page.locator('#full_name')).toHaveValue(username);// VD: active
  await expect(page.locator('#cellphone')).toHaveValue(cellphone);
  expect(page.getByRole('textbox', { name: email }).nth(1));
  // Thêm thông tin customer để chuyển trạng thái thành 'pre_transaction'
  const {email_customer, customer_name1, customer_name2, postcode3, postcode4, address2, address3, telephone} = testData.customerInfo
  await addInforCustomer(page,email_customer,customer_name1,customer_name2,postcode3,postcode4,address2,address3,telephone);
  await page.waitForTimeout(5000);

  // 5️⃣ Lấy thông tin customer từ API /profiles/me
  const { customerCode, status } = await getMe(request, baseUrl, token);
  expect(status).toBe('pre_transaction');
  expect(customerCode).toMatch(/^\d{8}$/);
  await page.waitForTimeout(1000);
});

test('TC3: Register customer with email already exist', async ({ page, request }) => {
  const {username, email_account, password, cellphone} = testData.accountExisted;
  console.log(username, email_account, cellphone);
  await page.goto('https://dev02.ec-vegekul.scoregre.com/signup');
  await page.waitForTimeout(2000)
  await createCustomerForm(page, username,cellphone,email_account);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "screenshots/TC3/login.png"});
  //expect (page.getByText(testData.textDefault.login)).toBeVisible();
  await page.fill('#password',password);
  await page.locator('button[type="submit"]').click();
  await checkProfile(page,email_account);
  await page.waitForTimeout(1000);
});

test('TC4: Login with email already exist', async ({ page, request }) => {
  const {email_account, password} = testData.accountExisted;
  const token = await loginEC(page, email_account,password);
  const baseUrl = testData.config.apiEC;
  const { customerCode, status } = await getMe(request, baseUrl, token);
  console.log('Customer Code:', customerCode);
  console.log('Status:', status);
  await checkProfile(page,email_account);
  await page.waitForTimeout(1000);
});

test('TC5: Register customer with flyer - email_account chưa tồn tại trong hệ thống', async ({ page, request }) => {
  const {email_account, password} = testData.accountExisted;
  const {username, cellphone} = testData.signUp
  console.log (email_account, username, cellphone)
  await page.goto('https://dev02.ec-vegekul.scoregre.com/signup');
  await page.waitForTimeout(2000)
  await createCustomerForm(page, username,cellphone,email_account);
  await loginEC(page, email_account, password);
  await checkProfile(page,email_account);
  await page.getByRole('button', {name: '新規店舗追加'}).click();
  const{customer_code, customer_name1, customer_name2,email_customer, postcode3, postcode4, address2, address3, telephone } = testData.customerInfo;
  await addInforCustomer(page,email_customer,customer_name1,customer_name2,postcode3,postcode4,address2,address3,telephone);
  await page.waitForTimeout(3000);
  expect (page.getByText('ご登録ありがとうございます')).toBeVisible();
  await page.waitForTimeout(1000);
});

test ('TC6: Register customer with flyer - email_account chưa tồn tại trong hệ thống', async ({page, request})=>{
    // Login BpaaS và đi tới màn customer master
    const {apiEC,apiBpaaS} = testData.config

    const token = await loginBpaaS(page,apiBpaaS, request);
    console.log(`Token: ${token}`)
    await page.locator('[aria-label="得意先マスター"]').click();

    // Tạo customer mới với email chưa tồn tại trong account hệ thống 
    const generateData = generateDynamicData()
    const customer_code = generateData
    const { customer_name2, email} = testData.bpaaSNewCustomer
    const {customerCode, status,customerName2, customerEmail, customerID} =  await createCustomer(page, customer_code, customer_name2, email);
    console.log({customerCode, status,customerName2, customerEmail, customerID});
    if (!customerCode || !status || !customerName2 || !customerEmail || !customerID) {
      throw new Error('Failed to create customer or missing data in response');
    }   

    // Kiểm tra dữ liệu trả về có match với dữ liệu đã nhập
    expect(customerCode).toBe(customer_code);
    expect(status).toBe('manual_register');
    expect(customerName2).toBe(customer_name2);
    expect(customerEmail).toBe(email);
    const id = customerID;

    //Kiểm tra customer vừa tạo có trong danh sách hay không
    await page.waitForTimeout(3000); 
    const customerExists = await page.locator(`text=${customer_code}`).first().isVisible();
    expect(customerExists).toBeTruthy();

    // Xuất flyer
    await page.locator(`//button[text()='仮登録']`).nth(0).click();
    const printFlyer =  page.locator('button:has-text("チラシを印刷")');
    await expect(printFlyer).toBeDisabled();
    const sendMail = page.locator('button:has-text("メール送信")');
    await expect(sendMail).toBeDisabled();
    await page.locator('button:has-text("得意先情報を確認・編集する")').click();

    // update customer 
    await updateCustomer(page)

    // check button print flyer và send mail đã enable
    await expect(printFlyer).toBeEnabled();
    await expect(sendMail).toBeEnabled();

    // Get link flyer mở tab mới
    const URLFlyer = await getURLRegistered(id,apiBpaaS,token,request);
    const hashID = extractHashIdFromUrl(URLFlyer);
    
    // Open new tab with the flyer URL
    const page2 = await page.context().newPage();
    await page2.goto(URLFlyer);
    await page2.waitForTimeout(2000);

    // Chọn đăng kí bằng email
    await page2.getByRole('button', { name: 'メールアドレスで登録' }).click();

    // Đăng ký tài khoản với email của customer vừa tạo - ユーザー登録 page
    const username = 'Pam test username1';
    const cellphone = '03680573332';

    await page2.locator('#username').fill(username);
    await page2.locator('#cellphone').fill(cellphone);
    await page2.locator('button[type="submit"]').click();

    // 
    await page2.waitForTimeout(2000);
    const code = await confirmAccount(request, apiEC, username, cellphone, email, hashID);
    console.log('Verification Code:', code); 
    const approval_token = await verifyCode(page2, code);
    const tokenEC = await registerPassword(page2, approval_token);
    console.log(`Token EC: ${tokenEC}`);
    const { customerCode: customerCodeEC, status: statusEC } = await getMe(request, apiEC, tokenEC);
    console.log('Customer Code EC:', customerCodeEC);
    console.log('Status EC:', statusEC);
    expect(statusEC).toBe('in_transaction');
    expect(customerCodeEC).toBe(customer_code);
    await page2.waitForTimeout(2000); 
    await checkProfile(page2,email, username);
    await page.waitForTimeout(1000);

});

// test ('TC6_1: Register customer with flyer - email_account đã tồn tại trong hệ thống', async ({page, request})=>{
//     // Login BpaaS và đi tới màn customer master
//     const {apiEC,apiBpaaS} = testData.config

//     const token = await loginBpaaS(page,apiBpaaS, request);
//     console.log(`Token: ${token}`)
//     await page.locator('[aria-label="得意先マスター"]').click();

//     // Tạo customer mới với email chưa tồn tại trong account hệ thống 
//     const generateData = generateDynamicData()
//     const customer_code = generateData
//     const { customer_name2, email} = testData.bpaaSNewCustomer
//     console.log(customer_name2, email )
//     const {customerCode, status,customerName2, customerEmail, customerID} =  await createCustomer(page, customer_code, customer_name2, email);
//     console.log({customerCode, status,customerName2, customerEmail, customerID});
//     if (!customerCode || !status || !customerName2 || !customerEmail || !customerID) {
//       throw new Error('Failed to create customer or missing data in response');
//     }   

//     // Kiểm tra dữ liệu trả về có match với dữ liệu đã nhập
//     expect(customerCode).toBe(customer_code);
//     expect(status).toBe('manual_register');
//     expect(customerName2).toBe(customer_name2);
//     expect(customerEmail).toBe(email);
//     const id = customerID;

//     //Kiểm tra customer vừa tạo có trong danh sách hay không
//     await page.waitForTimeout(3000); 
//     const customerExists = await page.locator(`text=${customer_code}`).first().isVisible();
//     expect(customerExists).toBeTruthy();

//     await page.locator(`//button[text()='手動登録']`).nth(0).click();
//     const printFlyer =  page.locator('button:has-text("チラシを印刷")');
//     await expect(printFlyer).toBeDisabled();
//     const sendMail = page.locator('button:has-text("メール送信")');
//     await expect(sendMail).toBeDisabled();
//     await page.locator('button:has-text("確認・編集する")').click();

//     // update customer 
//     await updateCustomer(page)

//     // check button print flyer và send mail đã enable
//     await expect(printFlyer).toBeEnabled();
//     await expect(sendMail).toBeEnabled();

//     // Get link flyer mở tab mới
//     const URLFlyer = await getURLRegistered(id,apiBpaaS,token,request);
//     const hashID = extractHashIdFromUrl(URLFlyer);
    
//     // Open new tab with the flyer URL
//     const page2 = await page.context().newPage();
//     await page2.goto(URLFlyer);
//     await page2.waitForTimeout(2000);

//     // Chọn đăng kí bằng email
//     await page2.getByRole('button', { name: 'メールアドレスで登録' }).click();

//     // Đăng ký tài khoản với email của customer vừa tạo - ユーザー登録 page
//     const {username,email_account,cellphone,password} = testData.accountExisted;
//     await createCustomerForm(page2, username,cellphone,email_account);
//     // 
//     await page2.waitForTimeout(2000);
//     const token_invite = await loginInviteUI(page2, password)
//     console.log(token_invite)
//     const { customerCode: customerCodeEC, status: statusEC } = await getMe(request, apiEC, token_invite);
//     console.log(customerCodeEC, statusEC)
//     expect(customerCodeEC).toBe(customer_code);
//     await page2.waitForTimeout(2000); 
//     await checkProfile(page2,email, username);
//     await page.waitForTimeout(1000);
// });

// test ('TC7: get URL' , async ({page, request})=>{
//     const baseUrl = 'https://api.dev02.ec-vegekul.scoregre.com';
//     const token = await loginBpaaS(page,baseUrl, request);
//     console.log(token);
//   //   const id = 297;
//   //   const res = await request.get(`${baseUrl}/api/v1/master-data/customers/url-login-ec/${id}`, {
//   //   headers: {
//   //   Authorization: `Bearer ${token}`, // nếu cần
//   // },
//   //   });
//   //   const data = await res.json();
//   //   console.log('Flyer URL:', data);
//   //   if (!data.ec_url_login) {
//   //     throw new Error('Failed to get flyer URL from API');
//   //   }
//   //   const URL = data.ec_url_login;
//   //   await page.goto(URL); 
//   //   await page.waitForTimeout(2000);  
    
// });
// test ('TC8: get URL' , async ({page, request})=> {
//  const {username,email_account,cellphone} = testData.accountExisted;
// console.log(username,email_account,cellphone)})

