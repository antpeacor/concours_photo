(function () {
  const C = window.CONTEST;
  const $ = (id) => document.getElementById(id);
  const picked = new Set();
  let photos = [];
  let current = 0;
  const closed = new Date() > new Date(C.voteEnd);

  // Header text
  document.title = C.title;
  $("title").textContent = C.title;
  $("theme").textContent = C.theme;
  const end = new Date(C.voteEnd).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });
  $("rules").textContent = closed
    ? `Les votes sont clos depuis le ${end}. Merci à toutes et à tous !`
    : `Choisissez ${C.maxVotes > 1 ? `jusqu'à ${C.maxVotes} photos` : "votre photo préférée"}, puis envoyez votre vote. Un vote par personne, jusqu'au ${end}.`;
  $("idLabel").textContent = C.idLabel;
  $("voter").type = C.idType || "email";
  $("voter").placeholder = C.idPlaceholder;

  let alreadyVoted = false;
  try { alreadyVoted = localStorage.getItem("cse-photo-voted") === "1"; } catch (e) {}

  fetch("photos.json", { cache: "no-store" })
    .then((r) => r.json())
    .then((list) => { photos = list; render(); })
    .catch(() => { $("loadStatus").textContent = "Impossible de charger les photos. Vérifiez le fichier photos.json."; });

  function render() {
    $("loadStatus").remove();
    const wall = $("wall");
    photos.forEach((p, i) => {
      const fig = document.createElement("figure");
      fig.className = "print";
      fig.dataset.id = p.id;
      fig.innerHTML = `
        <button class="open" type="button" aria-label="Voir en grand : ${esc(p.title)}">
          <img src="${p.file}" alt="${esc(p.title)}" loading="lazy">
        </button>
        <figcaption>
          <span><span class="num">N°${i + 1}</span>${esc(p.title)}</span>
          <button class="pick" type="button" aria-pressed="false">Choisir</button>
        </figcaption>`;
      fig.querySelector(".open").onclick = () => openViewer(i);
      fig.querySelector(".pick").onclick = () => toggle(p.id);
      wall.appendChild(fig);
    });
    if (!closed) $("votebar").hidden = false;
    if (alreadyVoted) showMsg("Vous avez déjà voté depuis cet appareil. Merci !", "ok");
    sync();
  }

  function toggle(id) {
    if (closed) return;
    if (picked.has(id)) picked.delete(id);
    else if (C.maxVotes === 1) { picked.clear(); picked.add(id); }
    else if (picked.size < C.maxVotes) picked.add(id);
    sync();
  }

  function sync() {
    document.querySelectorAll(".print").forEach((fig) => {
      const on = picked.has(fig.dataset.id);
      fig.classList.toggle("is-picked", on);
      const b = fig.querySelector(".pick");
      b.setAttribute("aria-pressed", on);
      b.textContent = on ? "Choisie ✓" : "Choisir";
      b.disabled = closed || (!on && C.maxVotes > 1 && picked.size >= C.maxVotes);
    });
    const n = picked.size;
    $("count").textContent = n === 0 ? "Aucune photo choisie"
      : `${n} photo${n > 1 ? "s" : ""} choisie${n > 1 ? "s" : ""} sur ${C.maxVotes}`;
    $("send").disabled = n === 0;
    if (dlg.open) updateViewer();
  }

  // Submit vote
  $("votebar").addEventListener("submit", async (e) => {
    e.preventDefault();
    const voter = $("voter").value.trim();
    if (!voter || (C.idType === "email" && !$("voter").checkValidity())) {
      return showMsg("Indiquez un identifiant valide pour envoyer votre vote.", "err");
    }
    $("send").disabled = true;
    showMsg("Envoi en cours…");
    try {
      // text/plain body avoids a CORS preflight, which Apps Script doesn't support
      const res = await fetch(C.scriptUrl, { method: "POST", body: JSON.stringify({ voter, votes: [...picked] }) });
      const data = await res.json();
      showMsg(data.message, data.ok ? "ok" : "err");
      if (data.ok) {
        try { localStorage.setItem("cse-photo-voted", "1"); } catch (e) {}
        picked.clear(); sync(); $("send").disabled = true;
      } else $("send").disabled = picked.size === 0;
    } catch (err) {
      showMsg("Le vote n'a pas pu être envoyé. Vérifiez votre connexion et réessayez.", "err");
      $("send").disabled = false;
    }
  });

  function showMsg(text, kind) { const m = $("msg"); m.textContent = text; m.className = "msg " + (kind || ""); }

  // Lightbox
  const dlg = $("viewer");
  function openViewer(i) { current = i; updateViewer(); dlg.showModal(); }
  function updateViewer() {
    const p = photos[current];
    $("vImg").src = p.file; $("vImg").alt = p.title;
    $("vCap").textContent = `N°${current + 1} · ${p.title}`;
    const on = picked.has(p.id), b = $("vPick");
    b.setAttribute("aria-pressed", on);
    b.textContent = on ? "Choisie ✓" : "Choisir";
    b.hidden = closed;
    b.disabled = !on && C.maxVotes > 1 && picked.size >= C.maxVotes;
  }
  const step = (d) => { current = (current + d + photos.length) % photos.length; updateViewer(); };
  $("vPrev").onclick = () => step(-1);
  $("vNext").onclick = () => step(1);
  $("vClose").onclick = () => dlg.close();
  $("vPick").onclick = () => toggle(photos[current].id);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  document.addEventListener("keydown", (e) => {
    if (!dlg.open) return;
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
})();
