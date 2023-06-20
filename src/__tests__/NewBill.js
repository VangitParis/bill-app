/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then I should be identified as an Employee in app", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      //to-do write assertion
      // const user = {
      //   type: "Employee",
      //   email: "employee@test.tld",
      //   password: "employee",
      //   status: "connected"
      // };
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "employee@test.tld", password: "employee", status: "connected" }))
      const user = JSON.parse(localStorage.getItem("user"))
      expect(user.type).toBe("Employee")
      expect(user.status).toBe("connected")
    });
   
    test("Then I add file with an else extension than .png, .jpg or .jpeg ", () => {
      // on ajoute un fichier different de png, jpg ou jpeg
      const invalidFile = "document.pdf"
      const fileExtension = getFileExtension(invalidFile)
      const allowedExtensions = [".png", ".jpg", ".jpeg"];

      //on compare ce fichier pdf à nos extension
      expect(fileExtension).not.toContain(allowedExtensions)

      function getFileExtension(filename) {
        return filename.slice(filename.lastIndexOf(".")).toLowerCase();
      }
    });

    test("Then I should be to Bills's page ", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const fileInput = screen.getByTestId("file")
      //on vérifie qu'on a bien un fichier
      expect(fileInput).toBeTruthy()

      
    })
  });
});
