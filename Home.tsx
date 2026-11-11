import {LabIcon} from './LabIcon';

export function Home(){
  return <div className="lab-home">
    <section className="welcome">
      <div className="welcome-copy">
        <p className="kicker">THE VIRTUAL CHEMISTRY LAB</p>
        <h1>Chemistry,<br/>hands-on<span>.</span></h1>
        <p>Set up the bench, try the procedure and see what happens. LabCoat gives students a place to practise and lecturers a place to build practicals.</p>
      </div>
      <div className="welcome-art" aria-hidden="true">
        <svg viewBox="0 0 520 400" fill="none">
          <defs>
            <pattern id="bench-grid" width="23" height="23" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.1" fill="#9b90bd" opacity=".45"/>
            </pattern>
            <linearGradient id="hero-glass" x1="100" y1="90" x2="350" y2="310" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fff" stopOpacity=".92"/><stop offset="1" stopColor="#c1bcf2" stopOpacity=".62"/>
            </linearGradient>
            <linearGradient id="hero-liquid" x1="165" y1="170" x2="310" y2="290" gradientUnits="userSpaceOnUse">
              <stop stopColor="#b6eee5"/><stop offset="1" stopColor="#74c6d3"/>
            </linearGradient>
          </defs>
          <rect x="25" y="25" width="470" height="350" rx="25" fill="url(#bench-grid)"/>
          <circle cx="267" cy="194" r="132" fill="#e7dffc" stroke="#bdb1df"/>
          <path d="M39 286 276 245 484 297 248 350Z" fill="#8276a7"/>
          <path d="M39 286 248 350 484 297v14l-236 55L39 300Z" fill="#61547e"/>
          <path d="M114 288 272 261 408 294 248 327Z" fill="#c1e5e2"/>
          <ellipse cx="215" cy="279" rx="73" ry="12" fill="#5b547d" opacity=".24"/>
          <path d="M186 102h52v58l48 89c8 16 0 30-17 30H154c-17 0-25-14-17-30l49-89Z" fill="url(#hero-glass)" stroke="#74639f" strokeWidth="3"/>
          <path d="M160 226q29-13 55 0t53 0l16 28c5 11-1 21-15 21H154c-14 0-19-10-14-21Z" fill="url(#hero-liquid)" opacity=".85"/>
          <path d="m175 191-30 58m47-139v49" stroke="white" strokeWidth="5" strokeLinecap="round" opacity=".75"/>
          <rect x="180" y="95" width="64" height="12" rx="6" fill="#f9f6ff" stroke="#74639f" strokeWidth="3"/>
          <path d="M305 156h86l-10 113q-2 10-12 11h-45q-10 0-11-10Z" fill="url(#hero-glass)" stroke="#74639f" strokeWidth="3"/>
          <path d="M312 211q23 8 66 0l-5 54q-1 8-8 8h-39q-7 0-8-8Z" fill="#bfa8ef" opacity=".83"/>
          <path d="M323 181h15m-14 15h10m-8 15h12m-10 15h9" stroke="#74639f" strokeWidth="2" strokeLinecap="round"/>
          <path d="M306 156h87m-12 0 14-8" stroke="#74639f" strokeWidth="3" strokeLinecap="round"/>
          <ellipse cx="333" cy="307" rx="48" ry="13" fill="#f1eaff" stroke="#74639f" strokeWidth="2"/>
          <path d="m318 302 7-11 10 6-2 10-9 3Zm19 5 4-12 12-1 5 10-10 7Z" fill="#b69dea" stroke="#8c70bf" strokeWidth="1.5"/>
          <path d="M94 157v24m-12-12h24m307-67v20m-10-10h20" stroke="#8a70c3" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="277" cy="86" r="5" fill="#b69dea"/><circle cx="423" cy="214" r="5" fill="#9acdcf"/>
        </svg>
      </div>
    </section>
    <section className="workspace-cards" aria-label="Choose a workspace">
      <a className="workspace-card" href="/student">
        <span className="workspace-icon"><LabIcon name="flask" size={25}/></span>
        <span><small>FOR STUDENTS</small><strong>Student bench</strong><span>Run a practical, handle apparatus and record what you observe.</span></span>
        <span className="workspace-arrow" aria-hidden="true">↗</span>
      </a>
      <a className="workspace-card" href="/lecturer">
        <span className="workspace-icon lecturer-icon"><LabIcon name="notebook" size={25}/></span>
        <span><small>FOR LECTURERS</small><strong>Lecturer studio</strong><span>Turn a handout into a practical, preview it and review student work.</span></span>
        <span className="workspace-arrow" aria-hidden="true">↗</span>
      </a>
    </section>
    <p className="welcome-examples"><strong>Try an example in Lecturer Studio</strong><span>Titration</span><span>Crystallisation</span><span>Osmosis</span></p>
  </div>;
}
