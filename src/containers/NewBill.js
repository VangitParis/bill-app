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

  handleChangeFile = async (e) => {
    e.preventDefault();
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0];
    // console.log(file);
    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length - 1];
    // Vérifier l'extension du fichier
    const fileExtension = this.getFileExtension(fileName);
    const isValid = this.isValidFileExtension(fileExtension);

    if (isValid) {
      // Continuer uniquement si le fichier est valide
      const formData = new FormData();
      const email = JSON.parse(localStorage.getItem("user")).email;
      formData.append("file", file);
      formData.append("email", email);
    
       
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
    
      
    } else {
      const errorMessage = document.createElement("span");
      errorMessage.textContent =
        "Attention vous devez entrer un fichier png, jpg, jpeg ou gif.";
      errorMessage.classList.add("error-message");
      errorMessage.style.color = "red";
      const inputFile = document.querySelector(`input[data-testid="file"]`);
      inputFile.parentNode.insertBefore(errorMessage, inputFile.nextSibling);
      file.value = "";
      return;
    }
  };
  handleSubmit = (e) => {
    e.preventDefault();
    // console.log(
    //   'e.target.querySelector(`input[data-testid="datepicker"]`).value',
    //   e.target.querySelector(`input[data-testid="datepicker"]`).value
    // );
    const email = JSON.parse(localStorage.getItem("user")).email;

    // Récupérer les valeurs des champs du formulaire
    const type = e.target.querySelector(
      `select[data-testid="expense-type"]`
    ).value;
    const name = e.target.querySelector(
      `input[data-testid="expense-name"]`
    ).value;
    const amount = parseInt(
      e.target.querySelector(`input[data-testid="amount"]`).value
    );
    const date = e.target.querySelector(
      `input[data-testid="datepicker"]`
    ).value;
    const vat = e.target.querySelector(`input[data-testid="vat"]`).value;
    const pct =
      parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20;
    const commentary = e.target.querySelector(
      `textarea[data-testid="commentary"]`
    ).value;
    const fileUrl = this.fileUrl;
    const fileName = this.fileName;
    const status = "pending";

    // Vérifiez que les champs obligatoires sont remplis correctement
    const bill = {
      email,
      type,
      name,
      amount,
      date,
      vat,
      pct,
      commentary,
      fileUrl,
      fileName,
      status,
    };
    if (type || name || amount || date || vat || pct || fileUrl || fileName) {
      return this.updateBill(bill) && this.onNavigate(ROUTES_PATH["Bills"]);
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
