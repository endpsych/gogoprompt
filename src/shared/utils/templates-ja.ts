/**
 * Copyright (c) 2026 Ender De Freitas. All Rights Reserved.
 * Non-Commercial Use Only.
 */

export const TEMPLATES_JA = [
  // --- Writing (ライティング) ---
  {
    title: 'ビジネスメール作成',
    content: '件名: {{subject}}\n\n{{recipient_name}} 様\n\nお世話になっております、{{my_name}}です。\n\n{{topic}}の件についてご連絡いたしました。\n\n[詳細]\n{{details}}\n\nご確認のほど、よろしくお願いいたします。\n\n--------------------------------------------------\n{{my_name}}\n{{my_company}}',
    tags: ['メール', 'ビジネス', '仕事'],
    category: 'writing',
  },
  {
    title: '文章の校正・推敲',
    content: '以下の文章を、プロの編集者として校正してください。文法の間違いを修正し、より自然で洗練された日本語に書き換えてください。\n\n対象の文章:\n"""\n{{text}}\n"""\n\nトーン: {{tone}} (例: フォーマル、フレンドリー、説得力のある)',
    tags: ['校正', '執筆', '修正'],
    category: 'writing',
  },

  // --- Coding (コーディング) ---
  {
    title: 'コードの解説',
    content: 'あなたは経験豊富なプログラマーです。以下の{{language}}のコードが何をしているか、初心者にもわかりやすく解説してください。\n\n```{{language}}\n{{code}}\n```',
    tags: ['コーディング', 'プログラミング', '学習'],
    category: 'coding',
  },
  {
    title: 'バグの特定と修正',
    content: '以下のコードにはバグがあります。原因を特定し、修正版のコードと、なぜその修正が必要なのかを説明してください。\n\nエラーメッセージ (あれば):\n{{error_message}}\n\nコード:\n```\n{{code}}\n```',
    tags: ['デバッグ', '修正', '開発'],
    category: 'coding',
  },

  // --- Business (ビジネス) ---
  {
    title: '会議のアジェンダ作成',
    content: '以下の情報を基に、効率的な会議のアジェンダ（進行表）を作成してください。\n\n会議の目的: {{goal}}\n参加者: {{participants}}\n所要時間: {{duration}}\n\n議論したいトピック:\n- {{topic_1}}\n- {{topic_2}}\n- {{topic_3}}',
    tags: ['会議', 'ビジネス', '計画'],
    category: 'business',
  },
  {
    title: 'SWOT分析',
    content: '以下の製品/サービスについて、SWOT分析（強み、弱み、機会、脅威）を行ってください。\n\n製品/サービス名: {{product_name}}\nターゲット層: {{target_audience}}\n主な特徴: {{features}}',
    tags: ['マーケティング', '分析', '戦略'],
    category: 'business',
  },

  // --- Analysis (分析) ---
  {
    title: 'データの要約',
    content: '以下のテキスト/データを要約し、重要なポイントを3つの箇条書きでまとめてください。\n\nテキスト:\n{{text}}',
    tags: ['要約', '分析', 'データ'],
    category: 'analysis',
  },

  // --- Creative (クリエイティブ) ---
  {
    title: 'ブログ記事のアイデア出し',
    content: '「{{topic}}」というテーマで、読者の興味を惹くブログ記事のタイトル案を10個出してください。ターゲット読者は「{{target_audience}}」です。',
    tags: ['ブログ', 'アイデア', 'マーケティング'],
    category: 'creative',
  },
  {
    title: '物語のプロット生成',
    content: '以下の要素を使って、短編小説のプロット（あらすじ）を作成してください。\n\nジャンル: {{genre}}\n主人公: {{protagonist}}\n舞台設定: {{setting}}\n重要なアイテム: {{item}}',
    tags: ['物語', '創作', 'ストーリー'],
    category: 'creative',
  },

  // --- Learning (学習) ---
  {
    title: '複雑な概念の簡略化',
    content: '「{{concept}}」という概念を、5歳の子供でもわかるように例え話を使って説明してください。',
    tags: ['学習', '説明', '教育'],
    category: 'learning',
  },
  {
    title: '言語学習（単語帳）',
    content: '{{language}}の学習中です。「{{topic}}」に関連する重要単語を10個挙げ、それぞれの意味と例文を作成してください。',
    tags: ['語学', '英語', '学習'],
    category: 'learning',
  },

  // --- Productivity (生産性) ---
  {
    title: 'タスクの優先順位付け',
    content: '以下のタスクリストを、緊急度と重要度に基づいて整理し（アイゼンハワー・マトリックス）、推奨される実行順序を提示してください。\n\nタスク:\n{{tasks}}',
    tags: ['タスク管理', '効率化', '計画'],
    category: 'productivity',
  }
];