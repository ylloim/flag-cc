import {LitElement, html} from 'lit-element';

import CountriesDataProvider from './countries-data-provider.js';

/**
 * <flag-cc> is a simple web component that display the flag of the
 * corresponding currency or country code.  Use the `currency` attribute to
 * display the currency flag or use `code` to display the country flag.
 *
 * If the flag is not found, it will displays either the `currency` or the
 * `code` that was specified by the user.
 *
 * ![screenshot](./screenshot.png)
 *
 * ## Installation and demo
 * This library depends on the famous LitElement library. To see the demo
 * locally in action please:
 *
 * ```
 * git clone https://github.com/yveslange/flag-cc.git
 * cd flag-cc && npm install
 * npm start
 * ```
 * Now you can navigate to `http://localhost:8000`
 *
 * You can build the source by running `npm run build`. The built distribution
 * will be located into `./build/`. Additionally, you can serve the built
 *
 *
 *
 *
 * ## How to use
 *
 * In your `index.html`:
 * ```
 *  <head>
 *    <script src="./node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
 *    <script type="module" src="./node_modules/flag-cc/index.js"></script>
 * ```
 *
 * Then you should be able to use \<flag-cc\> tag anywhere.
 * ```javascript
 * <flag-cc currency="CHF"></flag-cc>
 * <flag-cc currency="CNY"></flag-cc>
 * <flag-cc currency="CNH"></flag-cc>
 * <flag-cc currency="ABC"></flag-cc>
 * <flag-cc code="Unknown"></flag-cc>
 * <flag-cc code="FR"></flag-cc>
 * ```
 *
 * ## Technical
 * The flags will be searched in `./node_modules/flag-cc/flags/`. If you want to
 * change the path please refer to the property `imagesPath`.
 *
 */
class FlagCC extends LitElement {
  /**
   * Rendering function
   * @return {HTMLTemplate} A HTML template
   */
  render() {
    return html`
      <style>
        :host {
          display: flex;
          position: relative;
          min-height: 10px;
          min-width: 15px;
        }
        img {
          object-fit: cover;
          display: flex;
          flex-grow: 1;
          flex-direction: row;
          width: 100%;
          height: 100%;
          min-height: 12px;
        }

        :host([is-unknown]) {
          border: none;
        }

        #unknown_display {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: auto;
          text-align: center;
          font-size: 9px;
        }
      </style>

      <img
        title="${this._flag_title}"
        src="${this.imagesPath}${this._flagSrc}"
        alt=""
      ></img>

      <div id="unknown_display"></div>

    `;
  }

  /**
   * Properties of the element.
   * @return {Object} The properties.
   */
  static get properties() {
    return {
      /** The country code (eg: CH, FR, ...) */
      code: String,

      /** The currency code (eg: EUR, CNY, CHF, ...) */
      currency: String,

      /** The type of the flag ('country' or 'currency') */
      flagType: {type: String, attribute: 'flag-type', reflect: true},

      /**
       * Is true if the country or currency code is unknown. This is set by
       * flag-cc if the flag was not found.
       */
      isUnknown: {type: Boolean, attribute: 'is-unknown', reflect: true},

      /** The corresponding country name */
      country: Object,

      /** Configures where the images folder is located */
      imagesPath: {type: String, attribute: 'images-path', reflect: true},

      /** PRIVATES */
      _countries: Object,
      _flagSrc: String,
      _flag_title: String,
      _debouncer: Number,
      _DOM_UnknownDisplay: Element,
    };
  }

  /** Constructor */
  constructor() {
    super();

    // Set the path of the images
    this.imagesPath = './node_modules/flag-cc/flags/';
  }

  /** First update of the element */
  firstUpdated() {
    const shadowRoot = this.shadowRoot;
    this._DOM_UnknownDisplay = shadowRoot.querySelector('#unknown_display');
  }

  /**
   * When props get updated
   * @param {Object} props Hash of the properties that changed.
   */
  updated(props) {
    if (props.has('code') || props.has('currency')) {
      this._updateFlag(this.code, this.currency);
    }
  }

  /**
   * Update the flag using the currency name or the country code name.
   * @param {String} code - The country code to use.
   * @param {String} currency - The currency name to use.
   * @fire changed
   */
  _updateFlag(code, currency) {
    const countries = CountriesDataProvider.data;
    /**
     * Stops the updates when the list of countries and if one of the code or
     * currency is not defined.
     */
    if (!countries || (!code && !currency)) {
      return;
    }

    // Create a debouncer
    if (this._debouncer) {
      clearTimeout(this._debouncer);
    }
    this._debouncer = setTimeout(() => {
      let item = null; // The flag that was found.
      let flagType = null; // The flag type (currency or country).
      let flagSrc = ''; // The relative flag image source path.

      // Check if the country code was defined.
      if (code) {
        [flagSrc, item] = this.getCountryFlag(code);
        flagType = 'country';

        // Check for the currency was defined
      } else if (currency) {
        [flagSrc, item] = this.getCurrencyFlag(currency);
        flagType = 'currency';
      }

      // Display the flag if found or display a text.
      if (item) {
        this._flagSrc = flagSrc;
        this._flag_title = code != undefined ? item.name : item.currency;
        this.isUnknown = false;
        this._DOM_UnknownDisplay.innerText = '';
      } else {
        this._flagSrc = '';
        this._flag_title = code != undefined ? code : currency;
        this.isUnknown = true;
        this._DOM_UnknownDisplay.innerText = this._flag_title;
      }
      this.countries = item;
      this.flagType = flagType;
    }, 1);
  }

  /**
   * Retreive the country flag using the code
   * @param {String} code - The country code.
   * @return {String} flag - The flag to use.
   */
  getCountryFlag(code = '') {
    code = code.toUpperCase();
    const countries = CountriesDataProvider.data;
    let item = null;
    let flagSrc = ''; // The relative flag image source path.
    if (code.length == 2) {
      item = countries.byCode2[code];
    } else if (code.length == 3) {
      item = countries.byCode3[code];
    } else {
      console.warn(
          'FLAG-CC> code length should be either 2 or 3 (code:',
          code,
          ')',
      );
    }
    if (item) {
      flagSrc = 'countries/' + item.flag;
    } else {
      console.warn('The item was not found for code', code);
    }
    return [flagSrc, item];
  }

  /**
   * Retreive the currency flag using the currency name.
   * @param {String} currency - The currency name to use (eg: CHF, EUR, ...).
   * @return {String} flag - The flag to use.
   */
  getCurrencyFlag(currency) {
    currency = currency.toUpperCase();
    const countries = CountriesDataProvider.data;
    let item = null;
    let flagSrc = ''; // The relative flag image source path.

    item = countries.currencies[currency];
    if (item) {
      flagSrc = 'currencies/' + item.flag;
    } else {
      console.warn('The item was not found for currency', currency);
    }
    return [flagSrc, item];
  }
}

customElements.define('flag-cc', FlagCC);
