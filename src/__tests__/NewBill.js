/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
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

      // on ajoute un fichier different de png, jpg, jpeg ou gif
      const invalidFileName = "document.pdf";
      const inputFileName = screen.getByTestId("file");

      const newBillInstance = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
      });
      const fileExtension = newBillInstance.getFileExtension(invalidFileName);
      const isValid = newBillInstance.isValidFileExtension(fileExtension);
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
    test("Then handleChange uses FormData to add file and email", () => {
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

      const formDataMock = {
        append: jest.fn(),
      };
      global.FormData = jest.fn().mockImplementation(() => formDataMock);

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBillInstance = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
      });
      const filePath = "C:\\fakepath\\justificatif-billed.jpg";
      const file = screen.getByTestId("file").files[0];

      const fileName = { files: [file] };
      console.log(fileName);
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: filePath,
        },
      };
      const email = JSON.parse(localStorage.getItem("user")).email;

      // Simuler l'exécution de handleChangeFile avec l'événement et les valeurs de fichier simulées
      newBillInstance.handleChangeFile(event);

      // On vérifie que FormData soit correctement utilisé pour ajouter le fichier et l'email
      expect(formDataMock.append).toHaveBeenCalledWith("file", file);
      expect(formDataMock.append).toHaveBeenCalledWith("email", email);

      const createMock = jest.fn().mockRejectedValue(new Error("Test error"));
      const storeMock = {
        bills: jest.fn().mockReturnValue({ create: createMock }),
      };
      const newBillInstanceCatchError = new NewBill({
        document,
        onNavigate,
        store: storeMock,
        localStorage: localStorageMock,
      });
      newBillInstanceCatchError.handleChangeFile(event);
      expect(createMock).toHaveBeenCalled();
    });
  });

  // Test Retour sur la page Bills (#employee/bills)
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
      const newBillInstance = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn(newBillInstance.handleSubmit);
      newBillInstance.fileName = "justificatif-billed.jpg";

      const formNewBill = screen.getByTestId("form-new-bill");
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);

      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
    test("Then an error is caught in updateBill Method", () => {
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
      const updateMock = jest.fn().mockRejectedValue(new Error("Test error"));
      const billsMock = {
        update: updateMock,
      };
      const storeMock = {
        bills: jest.fn().mockReturnValue(billsMock),
      };
      const newBillInstanceCatchError = new NewBill({
        document,
        onNavigate,
        store: storeMock,
        localStorage: localStorageMock,
      });

      // On appel la méthode Update
      newBillInstanceCatchError.updateBill({ storeMock });

      // Test de la gestion de l'erreur 'catch'
      expect(updateMock).toHaveBeenCalled();
    });
  });
});
