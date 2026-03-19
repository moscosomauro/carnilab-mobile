
// Mapping ISO 3166-1 numeric code (used in TopoJSON) to ISO 3166-1 alpha-2 code
export const ISO_NUMERIC_TO_ALPHA2: { [key: string]: string } = {
    "004": "AF", "008": "AL", "010": "AQ", "012": "DZ", "016": "AS", "020": "AD", "024": "AO", "028": "AG", "031": "AZ",
    "032": "AR", "036": "AU", "040": "AT", "044": "BS", "048": "BH", "050": "BD", "051": "AM", "052": "BB", "056": "BE",
    "060": "BM", "064": "BT", "068": "BO", "070": "BA", "072": "BW", "074": "BV", "076": "BR", "084": "BZ", "086": "IO",
    "090": "SB", "092": "VG", "096": "BN", "100": "BG", "104": "MM", "108": "BI", "112": "BY", "116": "KH", "120": "CM",
    "124": "CA", "132": "CV", "136": "KY", "140": "CF", "144": "LK", "148": "TD", "152": "CL", "156": "CN", "158": "TW",
    "162": "CX", "166": "CC", "170": "CO", "174": "KM", "175": "YT", "178": "CG", "180": "CD", "184": "CK", "188": "CR",
    "191": "HR", "192": "CU", "196": "CY", "203": "CZ", "204": "BJ", "208": "DK", "212": "DM", "214": "DO", "218": "EC",
    "222": "SV", "226": "GQ", "231": "ET", "232": "ER", "233": "EE", "234": "FO", "238": "FK", "239": "GS", "242": "FJ",
    "246": "FI", "248": "AX", "250": "FR", "254": "GF", "258": "PF", "260": "TF", "262": "DJ", "266": "GA", "268": "GE",
    "270": "GM", "275": "PS", "276": "DE", "288": "GH", "292": "GI", "296": "KI", "300": "GR", "304": "GL", "308": "GD",
    "312": "GP", "316": "GU", "320": "GT", "324": "GN", "328": "GY", "332": "HT", "334": "HM", "336": "VA", "340": "HN",
    "344": "HK", "348": "HU", "352": "IS", "356": "IN", "360": "ID", "364": "IR", "368": "IQ", "372": "IE", "376": "IL",
    "380": "IT", "384": "CI", "388": "JM", "392": "JP", "398": "KZ", "400": "JO", "404": "KE", "408": "KP", "410": "KR",
    "414": "KW", "417": "KG", "418": "LA", "422": "LB", "426": "LS", "428": "LV", "430": "LR", "434": "LY", "438": "LI",
    "440": "LT", "442": "LU", "446": "MO", "450": "MG", "454": "MW", "458": "MY", "462": "MV", "466": "ML", "470": "MT",
    "474": "MQ", "478": "MR", "480": "MU", "484": "MX", "492": "MC", "496": "MN", "498": "MD", "499": "ME", "500": "MS",
    "504": "MA", "508": "MZ", "512": "OM", "516": "NA", "520": "NR", "524": "NP", "528": "NL", "531": "CW", "533": "AW",
    "534": "SX", "535": "BQ", "540": "NC", "548": "VU", "554": "NZ", "558": "NI", "562": "NE", "566": "NG", "570": "NU",
    "574": "NF", "578": "NO", "580": "MP", "581": "UM", "583": "FM", "584": "MH", "585": "PW", "586": "PK", "591": "PA",
    "598": "PG", "600": "PY", "604": "PE", "608": "PH", "612": "PN", "616": "PL", "620": "PT", "624": "GW", "626": "TL",
    "630": "PR", "634": "QA", "638": "RE", "642": "RO", "643": "RU", "646": "RW", "652": "BL", "654": "SH", "659": "KN",
    "660": "AI", "662": "LC", "663": "MF", "666": "PM", "670": "VC", "674": "SM", "678": "ST", "682": "SA", "686": "SN",
    "688": "RS", "690": "SC", "694": "SL", "702": "SG", "703": "SK", "704": "VN", "705": "SI", "706": "SO", "710": "ZA",
    "716": "ZW", "724": "ES", "728": "SS", "729": "SD", "732": "EH", "740": "SR", "744": "SJ", "748": "SZ", "752": "SE",
    "756": "CH", "760": "SY", "762": "TJ", "764": "TH", "768": "TG", "772": "TK", "776": "TO", "780": "TT", "784": "AE",
    "788": "TN", "792": "TR", "795": "TM", "796": "TC", "798": "TV", "800": "UG", "804": "UA", "807": "MK", "818": "EG",
    "826": "GB", "831": "GG", "832": "JE", "833": "IM", "834": "TZ", "840": "US", "850": "VI", "854": "BF", "858": "UY",
    "860": "UZ", "862": "VE", "876": "WF", "882": "WS", "887": "YE", "894": "ZM"
};

// Full Spanish Names for display
export const COUNTRY_NAMES: { [key: string]: string } = {
    "AF": "Afganistán", "AL": "Albania", "DE": "Alemania", "AD": "Andorra", "AO": "Angola", "AI": "Anguila", "AQ": "Antártida", "AG": "Antigua y Barbuda", "SA": "Arabia Saudita", "DZ": "Argelia", "AR": "Argentina", "AM": "Armenia", "AW": "Aruba", "AU": "Australia", "AT": "Austria", "AZ": "Azerbaiyán",
    "BS": "Bahamas", "BD": "Bangladés", "BB": "Barbados", "BH": "Baréin", "BE": "Bélgica", "BZ": "Belice", "BJ": "Benín", "BM": "Bermudas", "BY": "Bielorrusia", "BO": "Bolivia", "BA": "Bosnia y Herzegovina", "BW": "Botsuana", "BR": "Brasil", "BN": "Brunéi", "BG": "Bulgaria", "BF": "Burkina Faso", "BI": "Burundi", "BT": "Bután",
    "CV": "Cabo Verde", "KH": "Camboya", "CM": "Camerún", "CA": "Canadá", "QA": "Catar", "TD": "Chad", "CL": "Chile", "CN": "China", "CY": "Chipre", "VA": "Ciudad del Vaticano", "CO": "Colombia", "KM": "Comoras", "KP": "Corea del Norte", "KR": "Corea del Sur", "CI": "Costa de Marfil", "CR": "Costa Rica", "HR": "Croacia", "CU": "Cuba", "CW": "Curazao",
    "DK": "Dinamarca", "DM": "Dominica",
    "EC": "Ecuador", "EG": "Egipto", "SV": "El Salvador", "AE": "Emiratos Árabes Unidos", "ER": "Eritrea", "SK": "Eslovaquia", "SI": "Eslovenia", "ES": "España", "US": "Estados Unidos", "EE": "Estonia", "ET": "Etiopía",
    "PH": "Filipinas", "FI": "Finlandia", "FJ": "Fiyi", "FR": "Francia",
    "GA": "Gabón", "GM": "Gambia", "GE": "Georgia", "GH": "Ghana", "GI": "Gibraltar", "GD": "Granada", "GR": "Grecia", "GL": "Groenlandia", "GP": "Guadalupe", "GU": "Guam", "GT": "Guatemala", "GF": "Guayana Francesa", "GG": "Guernsey", "GN": "Guinea", "GW": "Guinea-Bisáu", "GQ": "Guinea Ecuatorial", "GY": "Guyana",
    "HT": "Haití", "HN": "Honduras", "HK": "Hong Kong", "HU": "Hungría",
    "IN": "India", "ID": "Indonesia", "IQ": "Irak", "IR": "Irán", "IE": "Irlanda", "BV": "Isla Bouvet", "IM": "Isla de Man", "CX": "Isla de Navidad", "NF": "Isla Norfolk", "IS": "Islandia", "KY": "Islas Caimán", "CC": "Islas Cocos", "CK": "Islas Cook", "FO": "Islas Feroe", "GS": "Islas Georgias del Sur", "HM": "Islas Heard y McDonald", "FK": "Islas Malvinas", "MP": "Islas Marianas del Norte", "MH": "Islas Marshall", "SB": "Islas Salomón", "TC": "Islas Turcas y Caicos", "VG": "Islas Vírgenes Británicas", "VI": "Islas Vírgenes de los EE.UU.", "IL": "Israel", "IT": "Italia",
    "JM": "Jamaica", "JP": "Japón", "JE": "Jersey", "JO": "Jordania",
    "KZ": "Kazajistán", "KE": "Kenia", "KG": "Kirguistán", "KI": "Kiribati", "KW": "Kuwait",
    "LA": "Laos", "LS": "Lesoto", "LV": "Letonia", "LB": "Líbano", "LR": "Liberia", "LY": "Libia", "LI": "Liechtenstein", "LT": "Lituania", "LU": "Luxemburgo",
    "MK": "Macedonia del Norte", "MG": "Madagascar", "MY": "Malasia", "MW": "Malaui", "MV": "Maldivas", "ML": "Malí", "MT": "Malta", "MA": "Marruecos", "MQ": "Martinica", "MU": "Mauricio", "MR": "Mauritania", "YT": "Mayotte", "MX": "México", "FM": "Micronesia", "MD": "Moldavia", "MC": "Mónaco", "MN": "Mongolia", "ME": "Montenegro", "MS": "Montserrat", "MZ": "Mozambique", "MM": "Myanmar",
    "NA": "Namibia", "NR": "Nauru", "NP": "Nepal", "NI": "Nicaragua", "NE": "Níger", "NG": "Nigeria", "NU": "Niue", "NO": "Noruega", "NC": "Nueva Caledonia", "NZ": "Nueva Zelanda",
    "OM": "Omán",
    "NL": "Países Bajos", "PK": "Pakistán", "PW": "Palaos", "PA": "Panamá", "PG": "Papúa Nueva Guinea", "PY": "Paraguay", "PE": "Perú", "PF": "Polinesia Francesa", "PL": "Polonia", "PT": "Portugal", "PR": "Puerto Rico",
    "GB": "Reino Unido", "CF": "República Centroafricana", "CZ": "República Checa", "CG": "República del Congo", "CD": "República Democrática del Congo", "DO": "República Dominicana", "RE": "Reunión", "RW": "Ruanda", "RO": "Rumania", "RU": "Rusia",
    "EH": "Sáhara Occidental", "WS": "Samoa", "AS": "Samoa Americana", "BL": "San Bartolomé", "KN": "San Cristóbal y Nieves", "SM": "San Marino", "MF": "San Martín", "PM": "San Pedro y Miquelón", "VC": "San Vicente y las Granadinas", "SH": "Santa Elena", "LC": "Santa Lucía", "ST": "Santo Tomé y Príncipe", "SN": "Senegal", "RS": "Serbia", "SC": "Seychelles", "SL": "Sierra Leona", "SG": "Singapur", "SX": "Sint Maarten", "SY": "Siria", "SO": "Somalia", "LK": "Sri Lanka", "SZ": "Suazilandia", "ZA": "Sudáfrica", "SD": "Sudán", "SS": "Sudán del Sur", "SE": "Suecia", "CH": "Suiza", "SR": "Surinam",
    "TH": "Tailandia", "TW": "Taiwán", "TZ": "Tanzania", "TJ": "Tayikistán", "IO": "Territorio Británico del Océano Índico", "TF": "Territorios Australes Franceses", "TL": "Timor Oriental", "TG": "Togo", "TK": "Tokelau", "TO": "Tonga", "TT": "Trinidad y Tobago", "TN": "Túnez", "TM": "Turkmenistán", "TR": "Turquía", "TV": "Tuvalu",
    "UA": "Ucrania", "UG": "Uganda", "UY": "Uruguay", "UZ": "Uzbekistán",
    "VU": "Vanuatu", "VE": "Venezuela", "VN": "Vietnam",
    "WF": "Wallis y Futuna",
    "YE": "Yemen", "DJ": "Yibuti",
    "ZM": "Zambia", "ZW": "Zimbabue"
};

export const getFlagEmoji = (countryCode: string) => {
    if (!countryCode) return "🏳️";
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

export const getCountryName = (code: string) => {
    if (!code) return "Desconocido";
    return COUNTRY_NAMES[code] || code;
}
