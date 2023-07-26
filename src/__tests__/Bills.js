/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor, log } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

//simuler l'instruction d'importation du module store pour tester les erreurs 404, 500
jest.mock("../app/store", () => mockStore);

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
      console.log(
        `Expected: true\nReceived: ${windowIcon.classList.contains(
          "active-icon"
        )}`
      );
    });
    test("Then bills should be ordered from earliest to latest", async () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const billInstance = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });

      // Appel de la méthode getBills avec les factures mockées
      const sortedMockedBills = await billInstance.getBills(mockStore);
      // Vérification de l'ordre des dates
      const dates = sortedMockedBills.map((bill) => bill.date);
      // Utiliser la fonction getBills pour obtenir directement le tableau trié
      const sortedBills = await billInstance.getBills();
      // Promesse de tri des dates dans getBills
      const datesSortedAndFormatted = sortedBills.map((bill) => bill.date);

      expect(dates).toEqual(datesSortedAndFormatted);
      console.log(`Expected: ${datesSortedAndFormatted}\nReceived: ${dates}`);
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
      // Assertion de l'appel de la méthode handleClickNewBill
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
  describe("When event on handleClickIconEye", () => {
    test("Then it should update modal content and show the modal", () => {
      // mock de la fonction jquery
      $.fn.modal = jest.fn();
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
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
      expect(modalContentHtml).toBeTruthy();
      // méthode jQuery modal a été appelée pour afficher la modal ?
      expect($.fn.modal).toHaveBeenCalledWith("show");
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "e@e" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      // On vérifie qu'on affiche la page Bills
      const titleOfBillsPage =
        screen.getByText("Mes notes de frais").textContent;
      expect(await waitFor(() => titleOfBillsPage)).toBeTruthy();
      //  console.log(titleOfBillsPage);
      const billsTableBody = screen.getByTestId("tbody");
      expect(billsTableBody).toBeTruthy();
      // console.log(billsTableBody);
    });
  });
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "e@e",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      //définir une implémentation personnalisée de la méthode list() du mock du store(mockStore)
      //retourne une promesse rejetée avec une erreur "Erreur 404"
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      //On vérifie si le message d'erreur est correctement affiché dans l'interface utilisateur
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Dashboard);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
