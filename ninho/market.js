'use strict';
// Currency selection only. No exchange rates or automatic conversion of saved amounts.
const LATAM_COUNTRIES = Object.freeze([
 {name:'México',currency:'MXN',locale:'es-MX',label:'pesos mexicanos'},
 {name:'Colombia',currency:'COP',locale:'es-CO',label:'pesos colombianos'},
 {name:'Argentina',currency:'ARS',locale:'es-AR',label:'pesos argentinos'},
 {name:'Chile',currency:'CLP',locale:'es-CL',label:'pesos chilenos'},
 {name:'Perú',currency:'PEN',locale:'es-PE',label:'soles'},
 {name:'Ecuador',currency:'USD',locale:'es-EC',label:'dólares estadounidenses'},
 {name:'Bolivia',currency:'BOB',locale:'es-BO',label:'bolivianos'},
 {name:'Paraguay',currency:'PYG',locale:'es-PY',label:'guaraníes'},
 {name:'Uruguay',currency:'UYU',locale:'es-UY',label:'pesos uruguayos'},
 {name:'Costa Rica',currency:'CRC',locale:'es-CR',label:'colones costarricenses'},
 {name:'Panamá',currency:'USD',locale:'es-PA',label:'dólares estadounidenses'},
 {name:'Guatemala',currency:'GTQ',locale:'es-GT',label:'quetzales'},
 {name:'Honduras',currency:'HNL',locale:'es-HN',label:'lempiras'},
 {name:'El Salvador',currency:'USD',locale:'es-SV',label:'dólares estadounidenses'},
 {name:'Nicaragua',currency:'NIO',locale:'es-NI',label:'córdobas'},
 {name:'República Dominicana',currency:'DOP',locale:'es-DO',label:'pesos dominicanos'},
 {name:'Puerto Rico',currency:'USD',locale:'es-PR',label:'dólares estadounidenses'},
 {name:'Venezuela',currency:'VES',locale:'es-VE',label:'bolívares'},
 {name:'Cuba',currency:'CUP',locale:'es-CU',label:'pesos cubanos'},
 {name:'Otro país (USD)',currency:'USD',locale:'es-419',label:'dólares estadounidenses'}
]);
const marketFor=country=>LATAM_COUNTRIES.find(c=>c.name===country)||{name:country||'Brasil',currency:'BRL',locale:'pt-BR',label:'reais brasileiros'};
const PAYMENT_CONFIG=Object.freeze({price:9.99,currency:'USD',mode:'one_time',checkoutUrl:window.NINHO_CONFIG?.checkoutUrl||''});
function validCheckout(url=PAYMENT_CONFIG.checkoutUrl){try{return new URL(url).protocol==='https:'}catch{return false}}
