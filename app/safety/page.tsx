import { safetyPolicy } from "../../lib/safety";

export default function SafetyPage() {
  return (
    <main className="page-shell">
      <header><a className="brand-small" href="/">MPlace Search</a><a href="/submit">Add a website</a></header>
      <div className="stack">
        <div>
          <h1 style={{fontSize: "42px"}}>Safety</h1>
          <p className="notice">MPlace Search uses one safety standard for everyone. There is no adult mode and no switch to disable filtering.</p>
        </div>
        <section className="card stack">
          <h2 style={{margin: 0}}>Content we do not index</h2>
          <ul className="notice">
            {safetyPolicy.block.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
        <section className="card stack">
          <h2 style={{margin: 0}}>Context matters</h2>
          <p className="notice">Sensitive words alone are not enough to block a page. Legitimate educational, medical, historical, news and public-safety content can still be indexed when its purpose is appropriate.</p>
          <ul className="notice">
            {safetyPolicy.contextSensitive.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      </div>
    </main>
  );
}
