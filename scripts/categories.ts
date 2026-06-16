// Keyword-rule policy categorization. The Diet does not tag bills by policy area,
// so we infer one from the bill title. Ordered: first matching category wins.

export interface CategoryDef {
  key: string;
  label: string;
  keywords: RegExp;
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'tax', label: '税制', keywords: /税|租税|関税|印紙|徴収|たばこ税|酒税|消費税|所得税|法人税|地方税/ },
  {
    key: 'welfare',
    label: '社会保障',
    keywords: /年金|医療|介護|健康保険|国民健康|福祉|生活保護|障害|児童|子ども|こども|育児|保育|母子|高齢者|社会保険|予防接種|接種|ゲノム|出産|衛生|感染症|伝染病|難病|臓器|血液|薬機|医薬品/
  },
  {
    key: 'foreign',
    label: '外交・安全保障',
    keywords: /条約|協定|外務|外交|防衛|自衛隊|安全保障|インテリジェンス|テロ|有事|在日米軍|国際/
  },
  {
    key: 'economy',
    label: '経済・産業',
    keywords: /金融|銀行|証券|保険業|産業|中小企業|商工|貿易|投資|公正取引|独占禁止|競争|景気|経済|公債|財政|決算|予算|郵政|郵便|信書|放送|通信|電気通信|衛星|宇宙|無人機|著作権|特許|知的財産|商標|本人確認/
  },
  { key: 'labor', label: '労働', keywords: /労働|雇用|賃金|最低賃金|職業|就労|労使|過労|働き方/ },
  {
    key: 'energy',
    label: '環境・エネルギー',
    keywords: /環境|エネルギー|電気事業|原子力|温暖化|脱炭素|再生可能|公害|廃棄物|リサイクル|気候/
  },
  { key: 'education', label: '教育・文化', keywords: /教育|学校|大学|学生|文化|スポーツ|科学技術|研究/ },
  {
    key: 'justice',
    label: '司法・行政',
    keywords: /刑法|民法|刑事|民事|裁判|司法|弁護士|警察|行政|地方自治|公務員|選挙|政治資金|個人情報|デジタル|マイナンバー|旅券|出入国|難民|防諜|犯罪|収益移転|憲法|政党交付金|歳費|国会議員|公職|情報会議|国家情報/
  },
  {
    key: 'agriculture',
    label: '農林水産',
    keywords: /農業|農林|農地|漁業|水産|林業|食品|食料|食糧|畜産|畜|森林|種苗|育成|家畜|競馬/
  },
  {
    key: 'infra',
    label: '国土・交通',
    keywords: /道路|鉄道|航空|港湾|交通|運輸|建築|住宅|都市|国土|河川|災害|復興|防災|インフラ|下水道|水道|物流|流通/
  }
];

export const DEFAULT_CATEGORY = { key: 'other', label: 'その他' };

export function classify(title: string): string {
  for (const c of CATEGORIES) {
    if (c.keywords.test(title)) return c.label;
  }
  return DEFAULT_CATEGORY.label;
}

export function allCategoryLabels(): string[] {
  return [...CATEGORIES.map((c) => c.label), DEFAULT_CATEGORY.label];
}
