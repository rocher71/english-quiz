// 오답 노트 공용 저장소 (이 기기·브라우저의 localStorage에만 저장)
// 기록: id → { g: 묶음 이름, url: 다시 풀기 링크, q: 문제, a: 정답, n: 틀린 횟수, t: 마지막으로 틀린 시각, ok: 그 뒤에 맞힘 }
// st: 페이지가 문항별로 들고 있는 상태 객체. 새 시험(다시 풀기·셔플)이면 페이지가 새 객체를 주므로 카운트도 새로 시작
// 공용: 위·아래 채점 버튼 글자 맞추기
function setGB(t) { document.querySelectorAll(".gradebtn").forEach(b => b.textContent = t); }

const WB = {
  KEY: "eq_wrong_v1",
  REVIEW: new URLSearchParams(location.search).get("review") === "1",
  load() { try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { return {}; } },
  save(d) { try { localStorage.setItem(this.KEY, JSON.stringify(d)); } catch (e) {} },
  // 채점 1건 반영. 같은 시험에서 같은 오답으로 다시 채점하면 횟수는 그대로
  // ans === null → 안 푼 문항: 오답 노트에 넣지 않음
  grade(id, ok, ans, st, info) {
    if (!ok && ans === null) return;
    const d = this.load();
    let r = d[id];
    if (!ok) {
      r = d[id] = Object.assign(r || { n: 0 }, info, { ok: false });
      if (st._wbAns !== ans) { st._wbAns = ans; r.n++; r.t = Date.now(); }
    } else if (r) {
      Object.assign(r, info);
      if (!st._wbRev) r.ok = true;   // 정답 공개 후 맞힌 건 해결로 안 침
    }
    this.save(d);
  },
  reveal(st) { st._wbRev = true; },
  // 선생님 "정답 처리" → 이번 시험에서 센 1회를 되돌림
  forgive(id, st) {
    const d = this.load(), r = d[id];
    if (r && st._wbAns !== undefined) { if (--r.n <= 0) delete d[id]; else r.ok = true; }
    st._wbAns = undefined;
    this.save(d);
  },
  // 다시 풀기 모드에서 보여줄 문항(아직 해결 안 한 오답). 페이지 열 때 한 번만 찍어 둠
  todo: null,
  inReview(id) {
    if (!this.todo) { const d = this.load(); this.todo = new Set(Object.keys(d).filter(k => !d[k].ok)); }
    return this.todo.has(id);
  },
  strip(html) { return new DOMParser().parseFromString(html.replace(/<br\s*\/?>/g, " "), "text/html").body.textContent.replace(/\s+/g, " ").trim(); }
};
