// 연습 페이지 공용 엔진: 페이지가 SECTIONS를 먼저 정의한 뒤 이 파일을 불러옴
const NUMS = "①②③④⑤";
// 섹션 구분 없이 전 문항을 섞어서 출제 (페이지 열 때·다시 풀기 때마다 새 순서)
const ITEMS = SECTIONS.flatMap(sec => sec.items);
function shuffle() {
  for (let i = ITEMS.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ITEMS[i], ITEMS[j]] = [ITEMS[j], ITEMS[i]]; }
}
let ans = {}, graded = null, first = null, rounds = 0, over = {}, open = {};

function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function norm(s) { return s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9]/g, ""); }
function no(n) { return '<span class="no">' + String(n).padStart(2, "0") + "</span>"; }

function renderItem(it, n) {
  const a = ans[n];
  let body;
  if (it.t === "pick") {
    const seg = it.o.map((o, i) => '<button class="pk' + (a === i ? " sel" : "") + '" onclick="choose(' + n + "," + i + ')">' + esc(o) + "</button>").join("/");
    body = '<div class="top">' + no(n) + '<span class="q-en">' + it.q.replace("[[]]", "[ " + seg + " ]") + "</span></div>";
  } else if (it.t === "mc") {
    body = '<div class="top">' + no(n) + '<span class="q-text">' + it.q + "</span></div>" +
      (it.en ? '<div class="given">' + esc(it.en) + "</div>" : "") +
      '<div class="opts">' + it.o.map((o, i) => '<button class="opt' + (a === i ? " sel" : "") + '" onclick="choose(' + n + "," + i + ')">' + NUMS[i] + " " + o + "</button>").join("") + "</div>";
  } else if (it.t === "blank") {
    const inp = '<input class="blank" data-n="' + n + '" size="8" value="' + esc(a || "") + '" autocomplete="off" spellcheck="false">';
    body = '<div class="top">' + no(n) + '<span class="q-en">' + esc(it.q).replace("___", inp) + "</span></div>" +
      '<div class="exp" style="margin-top:4px">' + esc(it.ko) + "</div>";
  } else {
    body = '<div class="top">' + no(n) + '<span class="q-text">' + it.q + "</span></div>" +
      '<div class="given">' + it.given + "</div>" +
      '<input class="writein" data-n="' + n + '" value="' + esc(a || "") + '" placeholder="Write the full sentence..." autocomplete="off" spellcheck="false">';
  }
  return '<div class="item" data-n="' + n + '"><span class="verdict"></span>' + body + '<div class="answer"></div></div>';
}

function render() {
  document.getElementById("content").innerHTML = ITEMS.map((it, i) => renderItem(it, i + 1)).join("");
  updateFill();
  if (graded) applyGrades();
  else { document.getElementById("statusMsg").textContent = "아직 채점 전"; document.getElementById("gradeBtn").textContent = "채점하기"; }
}

function choose(n, i) { ans[n] = i; render(); }
document.addEventListener("input", e => {
  if (!e.target.dataset.n) return;
  ans[e.target.dataset.n] = e.target.value;
  updateFill();
});
document.addEventListener("keydown", e => {
  if (e.key !== "Enter" || !e.target.dataset.n) return;
  const all = [...document.querySelectorAll(".writein, .blank")];
  const next = all[all.indexOf(e.target) + 1];
  if (next) { next.focus(); next.scrollIntoView({ block: "center" }); }
});

function updateFill() {
  const done = ITEMS.filter((it, i) => { const a = ans[i + 1]; return typeof a === "number" || (a && a.trim()); }).length;
  document.getElementById("fillCount").textContent = "작성 " + done + " / " + ITEMS.length;
}

function resetAll() { ans = {}; graded = null; first = null; rounds = 0; over = {}; open = {}; shuffle(); render(); }

// 1차 채점 결과는 first에 고정, 이후 채점은 "틀린 것 고친 뒤" 결과로 graded만 갱신
function gradeAll() {
  graded = {};
  ITEMS.forEach((it, i) => {
    const a = ans[i + 1];
    graded[i + 1] = (it.t === "mc" || it.t === "pick") ? a === it.a : it.a.some(x => norm(x) === norm(a || ""));
  });
  if (!first) first = { ...graded };
  rounds++;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function answerText(it) {
  if (it.t === "mc") return NUMS[it.a] + " " + it.o[it.a];
  if (it.t === "pick") return esc(it.o[it.a]);
  return it.a.map(esc).join(" &nbsp;/&nbsp; ");
}

function btn(label, cls, fn) {
  const b = document.createElement("button");
  b.className = "overbtn" + cls; b.textContent = label; b.onclick = fn; b.style.margin = "8px 6px 0 0";
  return b;
}

function applyGrades() {
  ITEMS.forEach((it, i) => {
    const n = i + 1;
    const card = document.querySelector('.item[data-n="' + n + '"]');
    const v = card.querySelector(".verdict"), box = card.querySelector(".answer");
    const pass = graded[n], od = over[n];
    card.classList.add(pass ? "correct" : od ? "override" : "wrong");
    v.textContent = pass ? "정답" : od ? "선생님 인정" : "오답";
    v.className = "verdict " + (pass ? "g" : od ? "o" : "b");
    // 답·해설은 선생님 채점 버튼을 눌렀을 때만 공개
    if (open[n]) box.innerHTML = "정답: <b>" + answerText(it) + '</b><div class="exp" style="margin-left:0">' + it.exp + "</div>";
    const row = document.createElement("div"); row.style.marginLeft = "34px";
    row.append(btn(open[n] ? "답·해설 닫기" : "선생님 채점", open[n] ? " on" : "", () => { open[n] = !open[n]; render(); }));
    if (open[n] && !pass) row.append(btn(od ? "✓ 선생님 인정됨 (취소)" : "정답 처리", od ? " on" : "", () => { over[n] = !over[n]; render(); }));
    box.after(row);
  });
  const cnt = g => { let ok = 0; ITEMS.forEach((it, i) => { if (g[i + 1] || (g === graded && over[i + 1])) ok++; }); return ok; };
  const f = cnt(first), c = cnt(graded), T = ITEMS.length;
  const ov = ITEMS.filter((it, i) => !graded[i + 1] && over[i + 1]).length;
  document.getElementById("statusMsg").innerHTML =
    "처음 채점: 정답 <b class='g'>" + f + "</b> · 오답 <b class='b'>" + (T - f) + "</b>" + (rounds < 2 && !ov ? "" :
    "　→　고친 후: 정답 <b class='g'>" + c + "</b>" + (ov ? " (인정 <b class='o'>" + ov + "</b>)" : "") + " · 오답 <b class='b'>" + (T - c) + "</b>");
  document.getElementById("gradeBtn").textContent = "고친 후 다시 채점";
}
shuffle();
render();
