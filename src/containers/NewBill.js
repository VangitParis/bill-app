import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.isFormDataValid = false;
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }

  getFileExtension(fileName) {
    return fileName.split(".").pop().toLowerCase();
  }

  /**
   * @return {boolean}
   */
  isValidFileExtension(fileExtension) {
    const allowedExtensions = ["png", "jpg", "jpeg", "gif"];
    return allowedExtensions.includes(fileExtension);
  }

  // isValidDate(dateString) {
  //   const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  //   return dateRegex.test(dateString)
  // }

  handleChangeFile = async (e) => {
    e.preventDefault();
    const file = this.document.querySelector(`input[data-testid="file"]`)
      .files[0];
    // console.log(file);
    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length - 1];
    // Vérifier l'extension du fichier
    const fileExtension = this.getFileExtension(fileName);
    const isValid = this.isValidFileExtension(fileExtension);

    if (!isValid) {
      const errorMessage = document.createElement("span");
      errorMessage.textContent =
        "Attention vous devez entrer un fichier png, jpg, jpeg ou gif.";
      errorMessage.classList.add("error-message");
      errorMessage.style.color = "red";
      const inputFile = document.querySelector(`input[data-testid="file"]`);
      inputFile.parentNode.insertBefore(errorMessage, inputFile.nextSibling);
      file.value = "";
      this.isFormDataValid = false;
      return;
    }
    // Continuer uniquement si le fichier est valide et le formulaire est soumis
    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem("user")).email;
    formData.append("file", file);
    formData.append("email", email);

   
    
    //Effacer message d'erreur existant pour en insérer un nouveau
    const errorMessageExisting = document.querySelector(".error-message");
    // file.value = "";
    this.isFormDataValid = false;
    if (errorMessageExisting) {
      errorMessageExisting.remove();
    } else {
       // Afficher un message d'erreur si le formulaire n'a pas été soumis
    const errorMessage = document.createElement("span");
    errorMessage.textContent =
      "Attention vous devez soumettre le formulaire pour créer une facture.";
    errorMessage.classList.add("error-message");
    errorMessage.style.color = "red";
    const inputFile = document.querySelector(`input[data-testid="file"]`);
      inputFile.parentNode.insertBefore(errorMessage, inputFile.nextSibling);
      this.isFormDataValid = false;
    }

    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true,
        },
      })
      .then(({ fileUrl, key }) => {
        this.billId = key;
        this.fileUrl = fileUrl;
        this.fileName = file.name;
        console.log("Bill created:", key, fileUrl);
      })
      .catch((error) => error);
  };

  handleSubmit = (e) => {
    e.preventDefault();
    // console.log(
    //   'e.target.querySelector(`input[data-testid="datepicker"]`).value',
    //   e.target.querySelector(`input[data-testid="datepicker"]`).value
    // );
    const email = JSON.parse(localStorage.getItem("user")).email;
    const date = e.target.querySelector(
      `input[data-testid="datepicker"]`
    ).value;

    // if (!this.isValidDate(date)) {
    //   console.error("Format de date incorrect");
    //   //Ne pas envoyer la facture
    //   return;
    // }
    const bill = {
      email,
      // Récupérer les valeurs des champs du formulaire
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
        e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
        parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
        20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
        .value,

      fileUrl: this.fileUrl,
      fileName: this.fileName,

      status: "pending",
    };
    // // Empêcher l'envoi du formulaire si au moins une des valeurs requises est fausse
    // if (
    //   !bill.type ||
    //   !bill.amount ||
    //   !bill.date ||
    //   !bill.email ||
    //   !bill.name ||
    //   !bill.vat ||
    //   !bill.pct
    // ) {
    //   console.error("Veuillez verifier les saisies du formulaire");
    //   this.isFormDataValid = false; 
    //   console.log(this.isFormDataValid);
    //   return;
    // }
    this.isFormDataValid = true;
    this.updateBill(bill);
    if (this.isFormDataValid) {
      this.onNavigate(ROUTES_PATH["Bills"]);
    }
  };
  // not need to cover this function by tests
  /* istanbul ignore next */
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => error);
    }
  };
}
