"use client"

import { useRef, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const members = [
  { name: "AINA IMAADUDEEN ABIODUN", matric: "20220204001" },
  { name: "OPEYEMI WARIS ABDULKAREEM", matric: "20220294001" },
  { name: "ABDULMALIK IBRAHIM OPEYEMI", matric: "20220294002" },
  { name: "DAVID OGHENERUONA AMABO", matric: "20220294003" },
  { name: "DOO AGNES DESMOND", matric: "20220294004" },
  { name: "ABDULAZEEZ GBADEBO ADELEYE", matric: "20220294005" },
  { name: "ADENUGA JOSHUA OLUWASEGUN", matric: "20220294006" },
  { name: "SHITTU FATAI ADIO", matric: "20220294007" },
  { name: "OJO TIMOTHY DAMILOLA", matric: "20220294009" },
  { name: "OLUSEGUN AFOLABI OLUWAPELUMI", matric: "20220294010" },
  { name: "FAYODA TAIWO OLUWASEGUNFUNMI", matric: "20220294011" },
  { name: "AJIBAWO PRECIOUS OLUWATOBI", matric: "20220294012" },
  { name: "NDUBUISI IFUNANYA PRECIOUS", matric: "20220294013" },
  { name: "OLUWATOBI DANIEL TAIWO", matric: "20220294014" },
  { name: "ERINFOLAMI MUKARAM ADEOLU", matric: "20220294015" },
  { name: "MOYOSORE GAWAT AWE", matric: "20220294016" },
  { name: "ABIODUN TAIWO CALEB", matric: "20220294017" },
  { name: "ABDULRASAQ OLAMILEKAN FALADE", matric: "20220294018" },
  { name: "AYANGBENRO CLEMENT-GOODNESS JESUTUNMISE", matric: "20220294019" },
  { name: "AWOGBEMILA OLUWAFERANMI SAMUEL", matric: "20220294020" },
  { name: "HASSAN MOBOLAJI HASSAN", matric: "20220294022" },
  { name: "AKINOLA OPEMIKUNRERE AKINKUNMI", matric: "20220294023" },
  { name: "ADEDEKE TOMIWA OLAMIDE", matric: "20220294024" },
  { name: "AKINTAYO DAVID OLUWABUSAYO", matric: "20220294025" },
  { name: "AUDU UGBEDE PETER", matric: "20220294026" },
  { name: "OGUNNIYI GAFAR AYOMIDE", matric: "20220294027" },
  { name: "AKINWANDE SUBOMI AZEEZ", matric: "20220294028" },
  { name: "ADEMOLA BOLUWATIFE AYOMIDE", matric: "20220294029" },
  { name: "VICTOR OLUWOLE ILEKOYA", matric: "20220294030" },
  { name: "OSIGWE CYNTHIA CHIOMA", matric: "20220294031" },
  { name: "EMMANUEL AYOMIDE OLADOKUN", matric: "20220294033" },
  { name: "AFOLABI ISRAEL OLUWAFERANMI", matric: "20220294034" },
  { name: "AKINFENWA BASIT OLAMILEKAN", matric: "20220294035" },
  { name: "SAHEED AYOMIDE ISMAIL", matric: "20220294036" },
  { name: "ONASANYA ABDULRASHEED OLAMILEKAN", matric: "20220294037" },
  { name: "ADESOLA ENIOLA JOSHUA", matric: "20220294038" },
  { name: "JIMOH SAMAD BAYONLE", matric: "20220294039" },
  { name: "FARUQ AYOMIDE BELLO", matric: "20220294040" },
  { name: "JOLAOSHO BOLUWATIFE DANIEL", matric: "20220294041" },
  { name: "DAVID OLUWASEUN SADIKU", matric: "20220294042" },
  { name: "OLORUNFEMI SAMUEL AYODEJI", matric: "20220294044" },
  { name: "OLUSESI GAFAR OPEMIPO", matric: "20220294045" },
  { name: "DOLAPO CHRISTIANA RAHEEM", matric: "20220294046" },
  { name: "EBUBE JENKINS MBAH", matric: "20220294047" },
  { name: "OLADUNJOYE PRAISE MARCUS", matric: "20220294048" },
  { name: "OLUWASEMILORE MICHEAL OSINUGA", matric: "20220294049" },
  { name: "AYOMIDE SAMUEL JOSEPH", matric: "20220294050" },
  { name: "FAWAZ AYOMIDE FASHINA", matric: "20220294051" },
  { name: "OLUWAJOBA THEOPHILUS OBAGBEMI", matric: "20220294052" },
  { name: "ODEJOBI RACHAEL OLUWATOBILOBA", matric: "20220294053" },
  { name: "LAWAL IDRIS OLAKUNLE", matric: "20220294054" },
  { name: "DOSUMU SAMUEL ADEONIYE", matric: "20220294055" },
  { name: "DOMINIC JUSTIN CHINEDU", matric: "20220294056" },
  { name: "ADENEKAN OLANREWAJU ABIODUN", matric: "20220294057" },
  { name: "AFOLABI ALIAZEEM RUFAI", matric: "20220294058" },
  { name: "FALOLA OLAWALE MUIZ", matric: "20220294059" },
  { name: "AKINBOBOLA BABATUNDE LAWRENCE", matric: "20220294062" },
  { name: "IDOWU RACHEAL OLUWABUSOLAMI", matric: "20220294063" },
  { name: "OLUWAPELUMI OLUWASEYI BAKARE", matric: "20220294064" },
  { name: "OBINNA MIRACLE EZENNAKENYI", matric: "20220294065" },
  { name: "ADEYENI OPEYEMI BUNMI", matric: "20220294066" },
  { name: "FADARE MICHAEL OKIKIOLA", matric: "20220294067" },
  { name: "AZEEZ OPEYEMI KAZEEM", matric: "20220294068" },
  { name: "SHITTU TAIWO JAMES", matric: "20220294070" },
  { name: "EKHARO MOSES AMANOKUMU", matric: "20220294072" },
  { name: "OLATUNJI OLAYINKA SAMUEL", matric: "20220294073" },
  { name: "AILERU OLUWATOBILOBA ADETAYO", matric: "20220294074" },
  { name: "OSIBO JOEL OLUWABUKUNMI", matric: "20220294075" },
  { name: "OLORUNTOBI JOSEPH AYOMIDE", matric: "20220294076" },
  { name: "SALAMI RAHMON OLAMIDE", matric: "20220294077" },
  { name: "AKINWALE RAPHAEL OLUWAPELUMI", matric: "20220294078" },
  { name: "MATTHEW JUSTUS EMMANUEL", matric: "20220294079" },
  { name: "WISDOM PENUEL AKPAN", matric: "20220294080" },
  { name: "AROWOJOLU DAVID OLUWAPELUMI", matric: "20220294082" },
  { name: "OLUWATOBILOBA JEREMIAH DARAMOLA", matric: "20220294083" },
  { name: "AHAMADU IBRAHIM SHEU", matric: "20220294084" },
  { name: "ABDULMUIZ OLUWAPELUMI JEARIOGBE", matric: "20220294085" },
  { name: "OLAJIDE GBOLAHAN MONSURU", matric: "20220294086" },
  { name: "AKINYEMI ZAINOB OPEYEMI", matric: "20220294087" },
  { name: "ODEDOYIN MICHAEL OBALOLUWA", matric: "20220294088" },
  { name: "FATIMAH OGBOGBE YINUSA", matric: "20220294089" },
  { name: "OLONADE MOSES ABIODUN", matric: "20220294090" },
  { name: "DARAMOLA OLAWUMI RASHEEDAT", matric: "20220294091" },
  { name: "OJO TEMITAYO SEWANU", matric: "20220294092" },
  { name: "AYOYINKA MICHAEL ODUALA", matric: "20220294094" },
  { name: "MARUF MALIK ADEBAYO", matric: "20220294096" },
  { name: "PETER EMMANUEL AWODI", matric: "20220294097" },
  { name: "ADETORO RUFUS ADEAYO", matric: "20220294098" },
  { name: "UTHMAN OLAMILEKAN ATANDA", matric: "20220294100" },
  { name: "LAWAL USMAN ADISA", matric: "20220294101" },
  { name: "GBOLAHAN OPEYEMI FALOLA", matric: "20220294102" },
  { name: "DIASHI FELIX CHIGOZIRI", matric: "20220294103" },
  { name: "BADEJO ANUOLUWAPO REBECCA", matric: "20220294104" },
  { name: "OYEKUNLE MATTHEW OLADOYIN", matric: "20220294105" },
  { name: "AYANWOLE OPEYEMI PRECIOUS", matric: "20220294106" },
  { name: "HASSAN OMOTOYOSI OLUWAFEYIKEMI", matric: "20220294107" },
  { name: "OLASUNKANMI RIDWAN OLUWAKOLADE", matric: "20220294108" },
  { name: "OLADOKUN VICTOR ISAAC", matric: "20220294109" },
  { name: "CLETUS BLESSING ANIETIE", matric: "20220294110" },
  { name: "ADEMOLA EBENEZER ADEBAYO", matric: "20220294111" },
  { name: "AKINROLE OLASILE MUJEEB", matric: "20220294112" },
  { name: "KAREEM SHINAAYO OYINLOLA", matric: "20220294113" },
  { name: "AHMED ADEBAYO MUSTAPHA", matric: "20220294114" },
  { name: "EMMANUEL ADEMOLA AROTIOWA", matric: "20220294115" },
  { name: "ADEWOLE AWAWU ADENIKE", matric: "20220294116" },
  { name: "OLUWANIFEMI LAWAL", matric: "20220294117" },
  { name: "SALAWUDEEN SHERIFF TEMITOPE", matric: "20220294118" },
  { name: "DANIEL OLUWATIMILEHIN AKANDE", matric: "20220294119" },
  { name: "AFOUWHE ISAAC PRAISE", matric: "20220294121" },
  { name: "RAPHAEL AYOMIDE ADEJINMI", matric: "20220294122" },
  { name: "LASISI TEMIDAYO SARAH", matric: "20220294123" },
  { name: "OKEOWO OLUWATIMILEHIN ABRAHAM", matric: "20220294124" },
  { name: "OGUNLUSI GOODNEWS ANJOLAJESU", matric: "20220294125" },
  { name: "GIWA ABDULQOYYUM OLATUNBOSUN", matric: "20220294126" },
  { name: "ADEBOYE FAVOUR PHILIP", matric: "20220294127" },
  { name: "MARUF RIDWANULLAH OPEYEMI", matric: "20220294128" },
  { name: "MICHAEL ADESHINA AFOLABI", matric: "20220294129" },
  { name: "DAWODU TEMITAYO AYOBAMI", matric: "20220294130" },
  { name: "AWODEJI OLAMIDE DANIEL", matric: "20220294131" },
  { name: "ORENAYA BOLUWATIFE PETER", matric: "20220294132" },
  { name: "ADEGBOYEGA MONISOLA HELEN", matric: "20220294133" },
  { name: "ODUNAYA JIMMY OLUWATOBILOBA", matric: "20220294134" },
  { name: "DANIEL AYOMIDE OLUWOLE", matric: "20220294135" },
  { name: "ABDULBASIT ENIOLA OLOWO", matric: "20220294136" },
  { name: "OLUWATOBILOBA AYOOLA TAIWO", matric: "20220294137" },
  { name: "AYUBA ABDULBASIT AYOMIDE", matric: "20220294138" },
  { name: "HAMZAT RAZAQ OPEYEMI", matric: "20220294139" },
  { name: "ABDULFATAI AYOMIKUN SOBANDE", matric: "20220294140" },
  { name: "OGUNLE JOSHUA AYOBAMI", matric: "20220294142" },
  { name: "AYOOLA SEGUN BLOOD", matric: "20220294143" },
  { name: "OYAFA NOJEEM OLUWADAMILARE", matric: "20220294144" },
  { name: "TAIWO IYANUOLUWA OMONIKE", matric: "20220294145" },
  { name: "OLUSEGUN ABOSEDE VICTORIA", matric: "20220294146" },
  { name: "DARIUS KURA EDEAGHE", matric: "20220294147" },
  { name: "OLADEJI PETER AJIBOLA", matric: "20220294148" },
  { name: "LAWAL KEHINDE HUSSEIN", matric: "20220294149" },
  { name: "OLUWATOFUNMI ABRAHAM ODUNUGA", matric: "20220294150" },
  { name: "AFOLABI MALIK OPEYEMI", matric: "20220294152" },
  { name: "EZENWA CHUKWUMA DANIEL", matric: "20220294153" },
  { name: "MICHEAL DAMILARE FALOLA", matric: "20220294154" },
  { name: "DAVID LAWRENCE MAYOWA", matric: "20220294155" },
  { name: "OMONIYI OLUWAFEMI SAMUEL", matric: "20220294156" },
  { name: "OGUNLEYE OMOTOLANI MARY", matric: "20220294157" },
  { name: "SAMUEL OLUWATOBI MONDAY", matric: "20220294158" },
  { name: "IBITOYE TIMILEYIN SAMSON", matric: "20220294159" },
  { name: "OLATUNBOSUN BENJAMIN OPEYEMI", matric: "20220294160" },
  { name: "EMMANUEL ADESEGUN ADEPEGBA", matric: "20220294161" },
  { name: "SADIKU AHMED ISRAEL", matric: "20220294162" },
  { name: "ILEMOBAYO ABRAHAM IGBEKELE", matric: "20220294163" },
  { name: "AYANLOLA ROKEEB IYANUOLUWA", matric: "20220294164" },
  { name: "OGUNYEMI EBENEZER DAMILARE", matric: "20220294165" },
  { name: "SAMSON AYOMIDE GBADAMOSI", matric: "20220294166" },
  { name: "OLATUNJI SAMUEL FERANMI", matric: "20220294167" },
  { name: "FRANCISCA FAITH IMANRAYI", matric: "20220294168" },
  { name: "PHILLIP FERANMI BABATUNDE", matric: "20220294169" },
  { name: "TOMIWA TOSIN AKINWUNMI", matric: "20220294170" },
  { name: "GABRIEL IMOLE IROKO", matric: "20220294171" },
  { name: "IBRAHIM RASHEED OPEYEMI", matric: "20220294172" },
  { name: "OLAITAN OLUWATOBILOBA ENOCH", matric: "20220294173" },
  { name: "ADEMOLA EMMANUEL MAYOMIKUN", matric: "20220294175" },
  { name: "STEPHEN ISAIAH CHIKOZURUM", matric: "20220294176" },
  { name: "ADENAYA DANIEL OLUWASEMILORE", matric: "20230294021" },
  { name: "IBRAHIM OPEYEMI OYEBOADE", matric: "20230294120" },
  { name: "OGUNBIYI ENIOLA MOLOLUWA", matric: "20230294151" },
]

function getInitials(name: string) {
  const parts = name.split(" ")
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`
  }
  return name.substring(0, 2)
}

function getGradient(name: string) {
  const gradients = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-orange-400 to-rose-500",
    "from-pink-500 to-rose-500",
    "from-indigo-500 to-blue-500",
    "from-teal-400 to-emerald-500",
    "from-amber-400 to-orange-500",
  ]
  const index = name.charCodeAt(0) % gradients.length
  return gradients[index]
}

function formatName(name: string) {
  return name
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function TeamCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const ref = scrollRef.current
    if (ref) {
      ref.addEventListener('scroll', checkScroll)
      return () => ref.removeEventListener('scroll', checkScroll)
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      <button
        onClick={() => scroll('left')}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center transition-all ${
          canScrollLeft ? 'opacity-100 hover:bg-gray-50' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>
      
      <button
        onClick={() => scroll('right')}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center transition-all ${
          canScrollRight ? 'opacity-100 hover:bg-gray-50' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll right"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>

      {/* Gradient Overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 to-transparent z-[5] pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 to-transparent z-[5] pointer-events-none" />

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-8 py-4 -mx-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {members.map((member, i) => (
          <MemberCard key={member.matric} member={member} index={i} />
        ))}
      </div>

      {/* Member Count */}
      <div className="text-center mt-6">
        <span className="inline-flex items-center gap-2 text-sm text-gray-500">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          {members.length} students contributed to this project
        </span>
      </div>
    </div>
  )
}

function MemberCard({ member, index }: { member: { name: string; matric: string }, index: number }) {
  const initials = getInitials(member.name)
  const gradient = getGradient(member.name)
  const formattedName = formatName(member.name)
  const nameParts = formattedName.split(" ")
  const firstName = nameParts[0]
  const lastName = nameParts[nameParts.length - 1]

  return (
    <div 
      className="flex-shrink-0 w-[200px] group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300">
        {/* Avatar */}
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg font-bold mb-4 group-hover:scale-105 transition-transform`}>
          {initials}
        </div>
        
        {/* Name */}
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
          {firstName} {lastName}
        </h3>
        
        {/* Matric */}
        <p className="text-xs text-gray-400 font-mono">
          {member.matric}
        </p>
      </div>
    </div>
  )
}
