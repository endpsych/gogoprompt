/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

// Core Languages (Existing)
import { en as enLocale } from './en';
import { es as esLocale } from './es';
import { ja as jaLocale } from './ja';

// Western Europe
import { de as deLocale } from './de';
import { fr as frLocale } from './fr';
import { it as itLocale } from './it';
import { pt as ptLocale } from './pt';
import { nl as nlLocale } from './nl';
import { ga as gaLocale } from './ga';
import { ca as caLocale } from './ca';
import { gl as glLocale } from './gl';
import { eu as euLocale } from './eu';

// Nordic
import { da as daLocale } from './da';
import { sv as svLocale } from './sv';
import { no as noLocale } from './no';
import { fi as fiLocale } from './fi';
import { is as isLocale } from './is'; 

// Eastern / Central Europe
import { uk as ukLocale } from './uk';
import { ru as ruLocale } from './ru';
import { pl as plLocale } from './pl';
import { cs as csLocale } from './cs';
import { sk as skLocale } from './sk';
import { hu as huLocale } from './hu';
import { ro as roLocale } from './ro';
import { bg as bgLocale } from './bg';

// Baltic
import { et as etLocale } from './et';
import { lv as lvLocale } from './lv';
import { lt as ltLocale } from './lt';

// Southern / Balkan / Mediterranean
import { el as elLocale } from './el';
import { hr as hrLocale } from './hr';
import { sr as srLocale } from './sr';
import { sl as slLocale } from './sl';
import { tr as trLocale } from './tr';
import { sq as sqLocale } from './sq';
import { mk as mkLocale } from './mk';
import { mt as mtLocale } from './mt';

// Asian - Ensure generated file names match import paths
import { ko as koLocale } from './ko';
import { zhCN as zhCNLocale } from './zh-CN'; 
import { zhHK as zhHKLocale } from './zh-HK';
import { hi as hiLocale } from './hi';
import { id as idLocale } from './id';
import { vi as viLocale } from './vi';
import { th as thLocale } from './th';
import { ms as msLocale } from './ms';
import { fil as filLocale } from './fil';

// Middle East
import { ar as arLocale } from './ar';
import { he as heLocale } from './he';
import { fa as faLocale } from './fa';
import { ur as urLocale } from './ur';


export const locales = {
  // Core
  en: enLocale, es: esLocale, ja: jaLocale,
  // Western Europe
  de: deLocale, fr: frLocale, it: itLocale, pt: ptLocale, nl: nlLocale, ga: gaLocale,
  // Iberian Regional
  ca: caLocale, gl: glLocale, eu: euLocale,
  // Nordic
  da: daLocale, sv: svLocale, no: noLocale, fi: fiLocale, is: isLocale,
  // Eastern / Central Europe
  uk: ukLocale, ru: ruLocale, pl: plLocale, cs: csLocale, sk: skLocale, hu: huLocale, ro: roLocale, bg: bgLocale,
  // Baltic
  et: etLocale, lv: lvLocale, lt: ltLocale,
  // Balkan / Mediterranean
  el: elLocale, hr: hrLocale, sr: srLocale, sl: slLocale, tr: trLocale, sq: sqLocale, mk: mkLocale, mt: mtLocale,
  // Asia - Use bracket notation for hyphenated keys
  ko: koLocale, 'zh-CN': zhCNLocale, 'zh-HK': zhHKLocale, hi: hiLocale, id: idLocale, vi: viLocale, th: thLocale, ms: msLocale, fil: filLocale,
  // Middle East
  ar: arLocale, he: heLocale, fa: faLocale, ur: urLocale
};