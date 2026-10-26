// Destinacionet turistike në Kosovë (të dhëna statike)
const DESTINATIONS = [
  {
    id: "prizren",
    name: "Prizreni",
    region: "Prizren",
    category: "histori",
    emoji: "🏰",
    colors: ["#b45309", "#7c2d12"],
    description:
      "Qyteti muze i Kosovës, me Kalanë e Prizrenit, Urën e Gurit, Xhaminë e Sinan Pashës dhe festivalin e njohur Dokufest.",
    tips: ["Ngjitu në kala në perëndim të diellit", "Provo qebapët te Shadërvani"],
  },
  {
    id: "rugova",
    name: "Gryka e Rugovës",
    region: "Pejë",
    category: "natyre",
    emoji: "⛰️",
    colors: ["#15803d", "#14532d"],
    description:
      "Kanion spektakolar në Bjeshkët e Nemuna me via ferrata, zipline dhe shtigje për ecje drejt Liqenit të Kuqishtës.",
    tips: ["Provo via ferrata-n", "Merr xhaketë – në mal bën freskët"],
  },
  {
    id: "pristina",
    name: "Prishtina",
    region: "Prishtinë",
    category: "qytet",
    emoji: "🏙️",
    colors: ["#1d4ed8", "#1e3a8a"],
    description:
      "Kryeqyteti i ri dhe energjik: monumenti NEWBORN, Biblioteka Kombëtare, Sheshi Skënderbeu dhe kafenetë e panumërta.",
    tips: ["Bëj foto te NEWBORN", "Pi një makiato në rrugën e Agimit Ramadanit"],
  },
  {
    id: "gjakova",
    name: "Çarshia e Madhe, Gjakovë",
    region: "Gjakovë",
    category: "histori",
    emoji: "🕌",
    colors: ["#a16207", "#713f12"],
    description:
      "Një nga pazaret më të vjetra në Ballkan, me dyqane zejtarësh, xhaminë e Hadumit dhe atmosferë autentike.",
    tips: ["Bli suvenire artizanale", "Vizito Urën e Terzive afër qytetit"],
  },
  {
    id: "mirusha",
    name: "Ujëvarat e Mirushës",
    region: "Malishevë",
    category: "natyre",
    emoji: "💧",
    colors: ["#0891b2", "#164e63"],
    description:
      "Seri prej 12 ujëvarash dhe 16 liqenesh në kanionin e lumit Mirusha – vend ideal për piknik dhe not në verë.",
    tips: ["Vish këpucë të forta", "Shko herët në mëngjes për më pak njerëz"],
  },
  {
    id: "gadime",
    name: "Shpella e Gadimes",
    region: "Lipjan",
    category: "natyre",
    emoji: "🦇",
    colors: ["#6d28d9", "#3b0764"],
    description:
      "Shpellë mermeri me stalaktite e stalagmite të rralla, e zbuluar rastësisht në vitin 1966.",
    tips: ["Brenda është rreth 12°C", "Vizitat janë me guidë"],
  },
  {
    id: "brezovica",
    name: "Brezovica",
    region: "Shtërpcë",
    category: "aventure",
    emoji: "🎿",
    colors: ["#0ea5e9", "#0c4a6e"],
    description:
      "Qendra kryesore e skijimit në Malet e Sharrit, me pista për të gjitha nivelet dhe pamje mahnitëse.",
    tips: ["Sezoni: dhjetor – mars", "Në verë – ecje drejt liqeneve akullnajore"],
  },
  {
    id: "decan",
    name: "Manastiri i Deçanit",
    region: "Deçan",
    category: "histori",
    emoji: "⛪",
    colors: ["#9f1239", "#4c0519"],
    description:
      "Manastir mesjetar i shekullit XIV, pjesë e Trashëgimisë Botërore të UNESCO-s, me afreske të mrekullueshme.",
    tips: ["Vishu në mënyrë të përshtatshme", "Kombinoje me Grykën e Deçanit"],
  },
  {
    id: "germia",
    name: "Parku i Gërmisë",
    region: "Prishtinë",
    category: "natyre",
    emoji: "🌲",
    colors: ["#4d7c0f", "#1a2e05"],
    description:
      "Park i madh pyjor në skaj të Prishtinës, me pishinë verore, shtigje vrapimi dhe restorante.",
    tips: ["Perfekt për një pasdite të qetë", "Pishina hapet në qershor"],
  },
  {
    id: "novoberde",
    name: "Kalaja e Novobërdës",
    region: "Novobërdë",
    category: "histori",
    emoji: "🧱",
    colors: ["#57534e", "#1c1917"],
    description:
      "Rrënojat e një qyteti minerar mesjetar të njohur për argjendin, mbi një kodër me pamje panoramike.",
    tips: ["Shiko perëndimin e diellit nga muret", "Rruga është pak e ngushtë"],
  },
  {
    id: "batllava",
    name: "Liqeni i Batllavës",
    region: "Podujevë",
    category: "aventure",
    emoji: "🚣",
    colors: ["#2563eb", "#172554"],
    description:
      "Liqen artificial i rrethuar me kodra, i preferuar për kajak, peshkim dhe pushime fundjave.",
    tips: ["Merr me qira një kajak", "Ka shumë restorante peshku afër"],
  },
  {
    id: "peja",
    name: "Peja & Patrikana",
    region: "Pejë",
    category: "qytet",
    emoji: "🍺",
    colors: ["#c2410c", "#431407"],
    description:
      "Qytet mikpritës në rrëzë të Rugovës, me çarshi të vjetër, Patrikanën e Pejës dhe kulla tradicionale.",
    tips: ["Shëtit në çarshinë e vjetër", "Provo flijen tradicionale"],
  },
];

const CATEGORIES = {
  all: "Të gjitha",
  natyre: "Natyrë",
  histori: "Histori",
  qytet: "Qytet",
  aventure: "Aventurë",
};
