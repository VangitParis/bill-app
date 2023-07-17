import { ROUTES_PATH } from "../constants/routes.js";
import { formatDate, formatStatus } from "../app/format.js";
import Logout from "./Logout.js";

export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const buttonNewBill = document.querySelector(
      `button[data-testid="btn-new-bill"]`
    );
    if (buttonNewBill)
      buttonNewBill.addEventListener("click", this.handleClickNewBill);
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`);
    if (iconEye)
      iconEye.forEach((icon) => {
        icon.addEventListener("click", () => this.handleClickIconEye(icon));
      });
    new Logout({ document, localStorage, onNavigate });
  }

  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH["NewBill"]);
  };

  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url");
    console.log(billUrl);
    const imgWidth = Math.floor($("#modaleFile").width() * 0.5);
    $("#modaleFile")
      .find(".modal-body")
      .html(
        `<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`
      );
    $("#modaleFile").modal("show");
  };
/**
 * Retrieve a sorted list of bills from the store.
 *
 * @returns {Promise<Array<Object>>} A Promise that resolves to an array of bills.
 * The array is sorted in descending order based on the `date` property of each bill object.
 * Each bill object in the array has the following properties:
 * - id: string
 * - vat: string
 * - fileUrl: string
 * - status: string
 * - type: string
 * - commentary: string
 * - name: string
 * - fileName: string
 * - date: Date
 * - amount: number
 *
 * If any bill in the store has corrupted data for the `date` property, it will be logged as an error,
 * and the date will be returned as it is without formatting.
 */
  getBills = () => {
    if (this.store) {
      return this.store
        .bills()
        .list()
        .then((snapshot) => {
          const bills = snapshot.map((doc) => {
            try {
              return {
                ...doc,
                date: new Date(doc.date), 
                status: formatStatus(doc.status),
              };
            } catch (e) {
              // if for some reason, corrupted data was introduced, we manage here failing formatDate function
              // log the error and return unformatted date in that case
              console.log(e, "for", doc);
              return {
                ...doc,
                date: doc.date,
                status: formatStatus(doc.status),
              };
            }
          });
          // tri des dates des tickets par ordre décroissant
          const sortedBills = bills.sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );

          sortedBills.forEach((bill) => {
            bill.date = formatDate(bill.date);
          });
          // return bills
          return sortedBills;
        });
    }
  };
}
