/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router";

//simuler l'instruction d'importation du module store pour tester les erreurs 404, 500
jest.mock("../app/store", () => mockStore);

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

    test("Then I add file with another extension than .png, .jpg, .jpeg or gif ", async () => {
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
      const inputFile = screen.getByTestId("file");

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
      fireEvent.change(inputFile, {
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
        "Attention vous devez entrer un fichier png, jpg, jpeg ou gif pour envoyer une facture."
      );
    });
    test("Then handleChange uses FormData to add file and email", async () => {
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
      const fileName = "justificatif-billed.jpg";

      const file = new File(["file content"], "justificatif-billed.jpg", {
        type: "image/jpeg",
      });
      const fileInput = screen.getByTestId("file");

      // Définir la valeur du champ 'value' de l'élément input
      Object.defineProperty(fileInput, "value", {
        writable: true,
        value: filePath,
      });

      const email = JSON.parse(localStorage.getItem("user")).email;

      // Simuler la sélection du fichier dans le champ de saisie de fichier
      fireEvent.change(fileInput, { target: { files: [fileName] } });

      // On vérifie que FormData soit correctement utilisé pour ajouter le fichier et l'email
      expect(formDataMock.append).toHaveBeenCalledWith("file", fileName);
      // console.log(formDataMock.append.mock.calls);
      expect(formDataMock.append).toHaveBeenCalledWith("email", email);
      // console.log(formDataMock.append.mock.calls);

      // Définition du mock pour la fonction create
      const createMock = jest.fn().mockRejectedValue(new Error("Test error"));

      // Définition du mock pour l'objet store avec la fonction create mockée
      const storeMock = {
        bills: jest.fn().mockReturnValue({ create: createMock }),
      };

      // Création d'une instance de NewBill avec les mocks
      const newBillInstanceCatchError = new NewBill({
        document,
        onNavigate,
        store: storeMock,
        localStorage: localStorageMock,
      });

      // Création de l'objet event simulé pour handleChangeFile
      const event = {
        preventDefault: jest.fn(),
        target: fileInput,
      };

      // Appel de handleChangeFile avec l'objet event simulé
      newBillInstanceCatchError.handleChangeFile(event);

      // Vérification que la fonction create a bien été appelée
      expect(createMock).toHaveBeenCalled();
    });
  });

  // Test Intégration Retour sur la page Bills (#employee/bills)
  describe("When I submit a correct form", () => {
    test("Then I should be redirected to Bills page", async () => {
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

      // On vérifie qu'on affiche la page NewBill
      expect(screen.getAllByText("Billed")).toBeTruthy();
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      // console.log(screen.getByTestId("form-new-bill"));

      // Définir les valeurs de fileUrl et fileName
      newBillInstance.fileUrl = "https://localhost:3456/images/test.jpg";
      newBillInstance.key = "1234";
      newBillInstance.fileName = "justificatif-billed.jpg";
      // Remplir le formulaire avec des données de test
      const expenseTypeInput = screen.getByTestId("expense-type");
      fireEvent.change(expenseTypeInput, { target: { value: "Transports" } });

      const expenseNameInput = screen.getByTestId("expense-name");
      fireEvent.change(expenseNameInput, {
        target: { value: "Vol Paris Londres" },
      });
      const dateInput = screen.getByTestId("datepicker");
      fireEvent.change(dateInput, { target: { value: "2023-07-21" } });

      const amountInput = screen.getByTestId("amount");
      fireEvent.change(amountInput, {
        target: { value: "100" },
      });

      const vatInput = screen.getByTestId("vat");
      fireEvent.change(vatInput, { target: { value: "70" } });

      const pctInput = screen.getByTestId("pct");
      fireEvent.change(pctInput, { target: { value: "20" } });

      const commentaryInput = screen.getByTestId("commentary");
      fireEvent.change(commentaryInput, {
        target: { value: "Commentaire de test" },
      });

      // Spy pour la fonction updateBill
      const updateBillSpy = jest.spyOn(newBillInstance, "updateBill");

      // Soumettre le formulaire (simule la requête POST)
      const submitButton = screen.getByText("Envoyer");
      fireEvent.click(submitButton);

      // Vérifier que la fonction updateBill a été appelée avec les bonnes données du formulaire (validation du formulaire réussie)
      expect(updateBillSpy).toHaveBeenCalledWith({
        email: "employee@test.tld",
        type: "Transports",
        name: "Vol Paris Londres",
        amount: 100,
        date: "2023-07-21",
        vat: "70",
        pct: 20,
        commentary: "Commentaire de test",
        fileName: newBillInstance.fileName,
        fileUrl: newBillInstance.fileUrl,
        status: "pending",
      });
      // console.log(updateBillSpy.mock.calls)
      // On vérifie que la redirection vers la page Bills a été effectuée après la soumission réussie
      const titleOfBillsPage =
        screen.getByText("Mes notes de frais").textContent;
      expect(await waitFor(() => titleOfBillsPage)).toBeTruthy();
      // console.log(titleOfBillsPage);
      const billsTableBody = screen.getByTestId("tbody");
      expect(billsTableBody).toBeTruthy();
      // console.log(billsTableBody);
    });
    test("Then form submission should be prevented for invalid or missing values", async () => {
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

      // Espionner la fonction console.error pour enregistrer les messages d'erreur
      const consoleErrorSpy = jest.spyOn(console, "error");

      // Simuler la soumission du formulaire avec des valeurs invalides
      const formNewBill = screen.getByTestId("form-new-bill");
      fireEvent.submit(formNewBill);

      const handleSubmit = jest.fn(newBillInstance.handleSubmit);
      // Vérifier que handleSubmit n'a pas été appelé
      expect(handleSubmit).not.toHaveBeenCalled();

      // Vérifier que console.error a été appelé avec le message attendu
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Veuillez verifier les saisies du formulaire"
      );
      // console.log(consoleErrorSpy.mock.calls);
    });

    //test unitaire : scenario où une erreur est attrapée dans la méthode "updateBill
    test("Then an error is caught in updateBill Method", async () => {
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
      // mock de update pour rejeter une promesse avec une erreur
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
      //console.log(updateMock.mock.calls);
    });
  });
});

// Test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to newBill's page", () => {
    test("Then create a new bill with mock API POST", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "e@e" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      // On défini la promesse attendue après la requête POST (création de facture réussie)
      const expectedBill = {
        fileUrl: "https://localhost:3456/images/test.jpg",
        key: "1234",
      };

      // Promesse
      const billsPromise = mockStore.bills().create(expectedBill);

      // Attendre que la promesse retournée par mockStore.bills().create() soit résolue
      const bills = await billsPromise;

      // Vérifier que la promesse a été résolue avec la valeur attendue
      expect(bills).toEqual(expectedBill);
      // console.log(bills);
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
      //définir une implémentation personnalisée de la méthode create() du mock du store(mockStore)
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/);
      // console.log(message.textContent);
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

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/);
      // console.log(message.textContent);
      expect(message).toBeTruthy();
    });
  });
});
