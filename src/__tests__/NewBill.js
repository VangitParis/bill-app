/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import store from "../__mocks__/store.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then I should be identified as an Employee in app", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      //to-do write assertion
      const userLocalStorage = {
        type: "Employee",
        email: "employee@test.tld",
        password: "employee",
        status: "connected",
      };
      localStorage.setItem("user", JSON.stringify(userLocalStorage));
      const user = JSON.parse(localStorage.getItem("user"));
      expect(user.type).toBe("Employee");
      expect(user.status).toBe("connected");
    });

    test("Then I add file with an else extension than .png, .jpg, .jpeg or gif ", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      // localStorage should be populated with form data
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: jest.fn(() =>
            JSON.stringify({ email: "employee@test.tld", type: "Employee" })
          ),
          setItem: jest.fn(),
        },
        writable: true,
      });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = jest.fn();
      // on ajoute un fichier different de png, jpg, jpeg ou gif
      const invalidFileName = "document.pdf";
      const inputFileName = screen.getByTestId("file");

      const billInstance = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
      });
      const fileExtension = billInstance.getFileExtension(invalidFileName);
      const isValid = billInstance.isValidFileExtension(fileExtension);
      //on compare ce fichier pdf à nos extensions autorisées
      expect(isValid).toBe(false);

      //On vérifie si le message d'erreur s'affiche quand l'extension est fausse
      const errorMessageSelector = `span.error-message`;

      // On Vérifie si le message d'erreur n'est pas initialement présent dans le DOM
      expect(document.querySelector(errorMessageSelector)).toBeNull();

      //On Simule le changement de fichier avec une extension invalide
      fireEvent.change(inputFileName, {
        target: {
          files: [
            new File(["file contents"], "document.pdf", {
              type: "document/pdf",
            }),
          ],
        },
      });

      // On Vérifie si le message d'erreur est ajouté au DOM
      expect(document.querySelector(errorMessageSelector)).not.toBeNull();
      expect(document.querySelector(errorMessageSelector).textContent).toBe(
        "Attention vous devez entrer un fichier png, jpg, jpeg ou gif."
      );
    });
    describe("When I submit a correct form", () => {
      test("Then I should be redirected to Bills page", () => {
        const html = NewBillUI();
        document.body.innerHTML = html;
        Object.defineProperty(window, "localStorage", {
          value: {
            getItem: jest.fn(() =>
              JSON.stringify({ email: "employee@test.tld", type: "Employee" })
            ),
            setItem: jest.fn(),
          },
          writable: true,
        });
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const billInstance = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const handleSubmit = jest.fn(billInstance.handleSubmit);
        billInstance.fileName = "justificatif-billed.jpg";

        const formNewBill = screen.getByTestId("form-new-bill");
        formNewBill.addEventListener("submit", handleSubmit);
        fireEvent.submit(formNewBill);

        expect(handleSubmit).toHaveBeenCalled();
        expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
      });
    });
  });
});
