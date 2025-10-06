import fs from "fs";
import path from "path";

// Load dữ liệu tĩnh từ JSON
const rawData = fs.readFileSync(path.join(__dirname, "testData.json"), "utf-8");
const staticData = JSON.parse(rawData);

// Sinh dữ liệu động
function generateDynamicData() {
  return {
    signUp: {
      username: `Pam_${Date.now()}`,
      cellphone: `09876543210`,
      email: `pam_customer_${Date.now()}@gmail.com`
    },

    customerInfo: {
      customer_name1: "Nguyen",
      customer_name2: "Van A",
      email_customer: `pam_email_customer_${Date.now()}@gmail.com`,
      postcode3: "100",
      postcode4:"0005",
      address2: "Ha Noi",
      address3: "Dong Da",
      telephone: "0368057333"
    },

    bpaaSNewCustomer: {
      customer_code: `123${Math.floor(10 + Math.random() * 90)}`,
      customer_name2: "Pam Test",
      email: `bpaas_${Date.now()}@gmail.com`,
      postal_code: "1000005",
      address2: "DN",
      address3: "06 Nguyen Van Linh",
      telephone: "0912345678"
    },

    staff: {
      username: `Staff_${Date.now()}`,
      cellphone: `01234567890`,
      email: `email_staff_${Date.now()}@gmail.com`
    }
  };
}

// Gộp thành một object duy nhất
export const testData = {
  ...staticData,
  ...generateDynamicData()
};
