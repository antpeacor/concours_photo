// ===== Réglages du concours — à modifier =====
window.CONTEST = {
  title: "Concours photo CSE",
  theme: "Thème 2026 : Lumières d'automne",

  // URL du script Google Apps Script (étape 2 du README)
  scriptUrl: "https://script.google.com/macros/s/AKfycbwKllPyGpmGj7_jvM34oGR4rw26L5bHdPwStAJHIJJZ8ORdRSPm5L26bi0s2LuuTT57/exec",

  // Nombre de photos que chaque personne peut choisir
  maxVotes: 1,

  // Fin des votes (heure de Paris). Doit être identique dans Code.gs
  voteEnd: "2026-11-15T23:59:00+01:00",

  // Champ d'identification du votant
  idLabel: "Votre e-mail professionnel",
  idPlaceholder: "prenom.nom@entreprise.fr",
  idType: "email" // "email" ou "text" (si vous utilisez des codes de vote)
};
