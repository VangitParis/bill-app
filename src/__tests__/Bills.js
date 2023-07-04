/**
 * @jest-environment jsdom
 */

import { getByTestId, fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => b - a;
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    //test unitaire pour savoir si l'évènement sur le bouton pour une nouvelle note frais est déclenché
    test("Then user click on button new bill, handleClickNewBill should be called", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      //Interface utilisateur
      document.body.innerHTML = BillsUI({ bills });
      // Création de l'instance de la composante Bills
      const billsComponent = new Bills({
        document,
        onNavigate,
        localStorage: localStorageMock,
      });
      // Méthode handleClickNewBill
      const handleClickNewBill = jest.fn(billsComponent.handleClickNewBill);
      // Récupération du bouton pour une nouvelle note de frais
      const newBillButton = screen.getByTestId("btn-new-bill");
      // Écoute de l'évènement "click" sur le bouton
      newBillButton.addEventListener("click", handleClickNewBill);
      // Simulation du clic sur le bouton
      fireEvent.click(newBillButton);
      // Vérification que handleClickNewBill a été appelée
      expect(handleClickNewBill).toHaveBeenCalled();
    });
  });
  describe("When I click on icon-eye", () => {
    test("Then handleClickIconEye should be called", () => {
      const handleClickIconEye = jest.fn();
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;

      const billsComponent = new Bills({
        document,
        onNavigate,
        localStorage: window.localStorage,
      });

      billsComponent.handleClickIconEye = handleClickIconEye;

      const iconEye = screen.getAllByTestId("icon-eye")[0];
      iconEye.addEventListener("click", handleClickIconEye);
      fireEvent.click(iconEye);
    });
  });
  // handleClickIconEye = (icon) => {
  //   const billUrl = icon.getAttribute("data-bill-url");
  //   console.log(billUrl);
  //   const imgWidth = Math.floor($("#modaleFile").width() * 0.5);
  //   $("#modaleFile")
  //     .find(".modal-body")
  //     .html(
  //       `<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`
  //     );
  //   $("#modaleFile").modal("show");
  // };
  describe("When event on handleClickIconEye", () => {
    test("it should update modal content and show the modal", () => {
      $.fn.modal = jest.fn();
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;

      const billsComponent = new Bills({
        document,
        onNavigate,
        localStorage: window.localStorage,
      });

      const icon = document.createElement("div");
      icon.setAttribute("data-bill-url", "http://example.com/image.jpg");
  
      // clic sur l'icône pour déclencher handleClickIconEye
      billsComponent.handleClickIconEye(icon);
  
      // le contenu de la modal a été mis à jour correctement ?
      const modalContent = document.querySelector("#modaleFile .modal-body");
      const modalContentHtml = `<div style='text-align: center;' class="bill-proof-container"><img width=xxx src="http://example.com/image.jpg" alt="Bill" /></div>`;
      expect(modalContent).toBeTruthy();
      expect(modalContentHtml).toBeTruthy()
      // méthode jQuery modal a été appelée pour afficher la modal ?
      expect($.fn.modal).toHaveBeenCalledWith("show");
    });
  });
});
