/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor, log } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { formatDate, formatStatus } from "../app/format.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

// Fonction utilitaire pour remplacer console.log
const mockConsoleLog = jest.fn();
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
    });

    test("Then bills should be ordered from earliest to latest", async () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      // Mock des données de facture
      const mockBills = [
        {
          id: "1",
          status: "refused",
          date: "2022-06-01", // Facture la plus ancienne
        },
        {
          id: "2",
          status: "accepted",
          date: "2023-01-15",
        },
        {
          id: "3",
          status: "pending",
          date: "2000-02-01",
        },
        {
          id: "4",
          status: "accepted",
          date: "2023-05-20", // Facture la plus récente
        },
      ];
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const storeMock = { bills: jest.fn(() => mockStore.bills()) };

      const billInstance = new Bills({
        document,
        onNavigate,
        store: storeMock,
        localStorage,
      });

      // Appel de la méthode getBills avec les factures mockées
      const sortedBills = await billInstance.getBills(mockBills);

      // Vérification de l'ordre des dates
      const dates = sortedBills.map((bill) => bill.date);
      const isSorted = dates.every((date, index) => {
        if (index === 0) return true;
        return (a, b) => new Date(b.date) - new Date(a.date);
      });

      // Assertion de l'ordre des dates
      expect(isSorted).toBe(true);
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
      // Assertion de l'appelle de la méthode handleClickNewBill
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
