export default function HeroMascot() {
  return (
    <div className="landing-mascot-enter relative mx-auto w-full max-w-[610px] lg:mx-0">
      <div className="speech-bubble absolute left-[2%] top-[2%] z-20 max-w-[190px] rounded-[22px] rounded-br-md bg-[#fffdf7] px-5 py-4 text-sm font-black leading-snug text-[#173f34] sm:left-[8%] sm:top-[5%]">
        Hôm nay mình ôn vừa đủ thôi nhé!
      </div>

      <span className="hero-particle hero-particle-one" aria-hidden="true" />
      <span className="hero-particle hero-particle-two" aria-hidden="true" />
      <span className="hero-particle hero-particle-three" aria-hidden="true" />

      <div className="mascot-float pt-12 sm:pt-4">
        <svg
          viewBox="0 0 620 540"
          role="img"
          aria-labelledby="lumi-title lumi-desc"
          className="h-auto w-full overflow-visible"
        >
          <title id="lumi-title">Lumi, mascot mầm từ của LAIO</title>
          <desc id="lumi-desc">
            Một nhân vật xanh vui vẻ mọc lên từ cuốn sổ học từ, xung quanh là các thẻ từ đầy màu sắc.
          </desc>

          <path
            d="M104 445c80-47 146-42 205-8 63-36 130-39 207 4l-31 48c-71-19-126-12-176 21-55-32-113-37-181-17l-24-48Z"
            fill="#fff9e7"
            stroke="#173f34"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          <path d="M309 438v68" stroke="#173f34" strokeWidth="7" strokeLinecap="round" />
          <path d="M123 458c66-21 126-13 186 22" stroke="#173f34" strokeWidth="5" strokeLinecap="round" opacity=".25" />
          <path d="M496 456c-67-19-128-10-187 24" stroke="#173f34" strokeWidth="5" strokeLinecap="round" opacity=".25" />

          <g className="mascot-card mascot-card-left">
            <rect x="47" y="224" width="112" height="142" rx="24" fill="#6ea8ff" stroke="#173f34" strokeWidth="7" />
            <path d="M75 264h55M75 286h37" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
            <circle cx="82" cy="330" r="7" fill="#173f34" />
            <circle cx="121" cy="330" r="7" fill="#173f34" />
            <path d="M88 345c10 9 20 9 29 0" fill="none" stroke="#173f34" strokeWidth="5" strokeLinecap="round" />
          </g>

          <g className="mascot-card mascot-card-right">
            <rect x="470" y="176" width="107" height="136" rx="24" fill="#f16d5a" stroke="#173f34" strokeWidth="7" />
            <path d="M496 218h54M496 240h34" stroke="#fff5dc" strokeWidth="9" strokeLinecap="round" />
            <circle cx="502" cy="280" r="6" fill="#173f34" />
            <circle cx="540" cy="280" r="6" fill="#173f34" />
            <path d="M509 291c8 7 16 7 24 0" fill="none" stroke="#173f34" strokeWidth="5" strokeLinecap="round" />
          </g>

          <path d="M302 125c-22-35-10-74 22-92 23 31 16 68-22 92Z" fill="#ffcf55" stroke="#173f34" strokeWidth="7" />
          <path d="M306 126c25-34 60-38 87-16-17 33-53 43-87 16Z" fill="#f690b7" stroke="#173f34" strokeWidth="7" />

          <path
            d="M190 308c0-104 46-176 126-176 84 0 137 73 137 177 0 87-54 153-135 153-78 0-128-65-128-154Z"
            fill="#d8e78f"
            stroke="#173f34"
            strokeWidth="9"
          />
          <path d="M208 326c-42 0-68 23-72 66 38 10 72-8 91-43" fill="#d8e78f" stroke="#173f34" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M441 317c43-3 72 18 79 60-37 14-73-2-95-35" fill="#d8e78f" stroke="#173f34" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />

          <g className="mascot-eyes">
            <ellipse cx="274" cy="284" rx="10" ry="14" fill="#173f34" />
            <ellipse cx="372" cy="284" rx="10" ry="14" fill="#173f34" />
          </g>
          <path d="M292 327c19 21 43 22 65 0" fill="none" stroke="#173f34" strokeWidth="8" strokeLinecap="round" />
          <circle cx="248" cy="321" r="13" fill="#f690b7" opacity=".75" />
          <circle cx="397" cy="321" r="13" fill="#f690b7" opacity=".75" />

          <path d="M256 452c-3 24-21 37-49 37" fill="none" stroke="#173f34" strokeWidth="9" strokeLinecap="round" />
          <path d="M382 453c4 23 22 35 50 34" fill="none" stroke="#173f34" strokeWidth="9" strokeLinecap="round" />

          <g transform="translate(410 82)">
            <path d="m0 23 15 4 7 15 8-15 16-4-16-7L22 0l-7 16-15 7Z" fill="#fff4c5" />
          </g>
        </svg>
      </div>
    </div>
  );
}