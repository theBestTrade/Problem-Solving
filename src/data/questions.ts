export type QuestionType = 'mc' | 'ox' | 'match' | 'order' | 'multi';

export interface BaseQuestion {
  ty: QuestionType;
  p: string;
  w: string;
  an: string;
  c?: string;
}

export interface McQuestion extends BaseQuestion {
  ty: 'mc';
  o: string[];
  a: number;
}

export interface OxQuestion extends BaseQuestion {
  ty: 'ox';
  a: boolean;
}

export interface MatchQuestion extends BaseQuestion {
  ty: 'match';
  left: string[];
  right: string[];
  a: number[];
}

export interface OrderQuestion extends BaseQuestion {
  ty: 'order';
  steps: string[];
  a: number[];
}

export interface MultiQuestion extends BaseQuestion {
  ty: 'multi';
  o: string[];
  a: number[];
}

export type Question = McQuestion | OxQuestion | MatchQuestion | OrderQuestion | MultiQuestion;

export interface Section {
  t: string;
  anim: string;
  k?: string;
  qs: Question[];
}

export const TYNAME: Record<QuestionType, string> = {
  mc: '객관식',
  ox: 'OX',
  match: '선잇기',
  order: '순서 맞추기',
  multi: '모두 고르기',
};

export const QUESTIONS_DATA: Section[] = [
  {
    t: "1교시 · 데이터셋 · 1초 맞추기 · Log-Mel 입력",
    anim: "D5-2 데이터셋과 분할 · D5-3 1초 음성 → Log-Mel",
    qs: [
      {
        ty: "mc",
        p: "Speech Commands 클립에 대한 설명으로 옳은 것은 무엇입니까?",
        o: [
          "10초 길이의 문장 녹음",
          "44.1 kHz 스테레오 음악",
          "1초 이하, 16 kHz, mono 단어 녹음",
          "한 사람이 모든 단어를 녹음"
        ],
        a: 2,
        w: "약 10만 5천 개의 1초 이하 · 16 kHz 단어 클립을 2,600명 이상이 녹음했습니다.",
        an: "노트북 Part 1 표"
      },
      {
        ty: "ox",
        p: "화자 기준으로 나누면 같은 사람의 녹음이 학습과 테스트에 동시에 들어가지 않습니다.",
        a: true,
        w: "hash(speaker) mod 100으로 정하므로 같은 화자는 항상 같은 쪽에 남습니다.",
        an: "D5-2 · 화자 기준 분할"
      },
      {
        ty: "mc",
        p: "무작위로 나눠 같은 화자가 학습과 테스트에 섞이면 어떤 문제가 생깁니까?",
        o: [
          "학습이 불가능해진다",
          "모델이 단어 대신 목소리를 외워 정확도가 실제보다 높게 나온다",
          "샘플링 레이트가 바뀐다",
          "클래스 수가 줄어든다"
        ],
        a: 1,
        w: "이것을 데이터 누수라고 합니다. 실제 사용자는 처음 듣는 목소리입니다.",
        an: "D5-2 · 빨간 테두리"
      },
      {
        ty: "mc",
        p: "0.62초(9,920샘플) 클립을 1초로 맞추려면 뒤에 0을 몇 개 붙여야 합니까?",
        o: ["9,920개", "16,000개", "620개", "6,080개"],
        a: 3,
        w: "16,000 − 9,920 = 6,080. np.pad(y, (0, n − len(y))).",
        an: "빈칸 실습 1 · D5-2 pad_or_trim"
      },
      {
        ty: "match",
        p: "특징 설정과 의미를 이으세요.",
        left: ["n_fft = 400", "hop_length = 160", "n_mels = 64", "top_db = 80"],
        right: [
          "최댓값보다 80 dB 이상 작은 값은 잘라 냄",
          "창 길이 25 ms",
          "세로(주파수) 줄 수",
          "10 ms마다 한 프레임"
        ],
        a: [1, 3, 2, 0],
        w: "D3과 같은 25 ms 창 · 10 ms hop에 mel 64줄입니다.",
        an: "D5-3 · 수식 줄"
      },
      {
        ty: "mc",
        p: "1초(16,000샘플), hop 160, center=True일 때 Log-Mel의 프레임 수는?",
        o: ["101", "100", "160", "64"],
        a: 0,
        w: "M = 1 + ⌊16000/160⌋ = 101. 그래서 입력 모양이 (1, 64, 101)입니다.",
        an: "빈칸 실습 2"
      },
      {
        ty: "order",
        p: "한 클립을 CNN 입력으로 바꾸는 순서대로 놓으세요.",
        steps: [
          "학습 세트 μ, σ로 정규화",
          "soundfile로 읽기",
          "pad_or_trim으로 16,000샘플 맞추기",
          "MelSpectrogram → AmplitudeToDB"
        ],
        a: [1, 2, 3, 0],
        w: "읽기 → 1초 맞추기 → Log-Mel → 정규화.",
        an: "Part 1 ~ 2"
      },
      {
        ty: "ox",
        p: "검증 · 테스트 세트는 각자 자기 데이터의 평균과 표준편차로 정규화해야 합니다.",
        a: false,
        w: "항상 학습 세트의 μ, σ를 그대로 씁니다. 예측(배포) 때도 마찬가지입니다.",
        an: "Part 2-2 정규화"
      },
      {
        ty: "multi",
        p: "PyTorch Dataset · DataLoader에 대한 설명으로 옳은 것을 모두 고르세요.",
        o: [
          "Dataset은 __len__과 __getitem__을 정의한다",
          "DataLoader는 batch_size개씩 묶어 배치를 만든다",
          "학습용 DataLoader는 보통 shuffle=True로 순서를 섞는다",
          "DataLoader가 자동으로 정확도를 계산한다"
        ],
        a: [0, 1, 2],
        w: "정확도는 우리가 학습 · 평가 루프에서 직접 계산합니다.",
        an: "빈칸 실습 3"
      },
      {
        ty: "mc",
        p: "batch_size = 128일 때 학습 DataLoader에서 꺼낸 한 배치의 특징 모양은?",
        o: [
          "(1, 64, 101)",
          "(128, 101, 64)",
          "(128, 1, 64, 101)",
          "(64, 101, 128)"
        ],
        a: 2,
        w: "(배치, 채널, mel, 프레임). 정답은 (128,) 모양입니다.",
        an: "빈칸 실습 3 출력"
      }
    ]
  },
  {
    t: "2교시 · CNN · softmax · cross-entropy",
    anim: "D5-4 합성곱 · D5-5 모델 구조 · D5-6 softmax · loss",
    qs: [
      {
        ty: "mc",
        p: "합성곱(convolution)이 각 출력 칸에서 하는 계산은 무엇입니까?",
        o: [
          "칸들의 최댓값을 고른다",
          "입력을 그대로 복사한다",
          "FFT를 계산한다",
          "필터와 겹친 칸끼리 곱해서 모두 더하고 편향을 더한다"
        ],
        a: 3,
        w: "D3 DFT의 '곱해서 더하기'와 같은 원리이고, 필터 값은 학습으로 정해집니다.",
        an: "D5-4 · 미끄러지기"
      },
      {
        ty: "mc",
        p: "입력 높이 H = 64, K = 3, P = 1, S = 1이면 합성곱 출력 높이는?",
        o: ["64", "62", "32", "66"],
        a: 0,
        w: "⌊(64 + 2 − 3)/1⌋ + 1 = 64. 크기가 유지됩니다.",
        an: "D5-4 · 수식 줄"
      },
      {
        ty: "mc",
        p: "Conv2d(16, 32, kernel_size=3)의 파라미터 수는?",
        o: ["512", "4,640", "4,608", "288"],
        a: 1,
        w: "16·32·9 + 32 = 4,640. 마지막 32는 출력 채널마다 하나씩인 편향입니다.",
        an: "D5-4 · 파라미터 계산기"
      },
      {
        ty: "ox",
        p: "MaxPool2d(2)는 2 × 2 칸 중 최댓값만 남겨 가로 · 세로 크기를 절반으로 줄입니다.",
        a: true,
        w: "64 × 101 → 32 × 50 (홀수는 버림).",
        an: "D5-5 · Block 1"
      },
      {
        ty: "match",
        p: "층과 역할을 이으세요.",
        left: [
          "BatchNorm",
          "ReLU",
          "Global Average Pooling",
          "Dropout"
        ],
        right: [
          "채널마다 모든 칸의 평균 하나로 줄임",
          "학습 중 일부 값을 무작위로 0으로",
          "배치마다 평균 · 분산을 맞춰 학습 안정",
          "음수를 0으로 (비선형성)"
        ],
        a: [2, 3, 0, 1],
        w: "Conv → BN → ReLU → MaxPool이 한 블록입니다.",
        an: "노트북 3-2 표"
      },
      {
        ty: "order",
        p: "KWSNet에서 입력이 지나가는 순서대로 놓으세요.",
        steps: [
          "Linear 64 → 10 (logit)",
          "Conv 블록 4개",
          "입력 (1, 64, 101)",
          "Global Average Pooling → (64,)"
        ],
        a: [2, 1, 3, 0],
        w: "모양: (1,64,101) → (64,4,6) → (64,) → (10,).",
        an: "D5-5 · 모양 추적"
      },
      {
        ty: "mc",
        p: "logit이 [2, 0, 0]일 때 softmax 확률에 대한 설명으로 옳은 것은?",
        o: [
          "확률은 [2, 0, 0]이다",
          "세 확률이 모두 같다",
          "첫 번째가 가장 크고, 세 확률의 합은 1이다",
          "확률 합은 2이다"
        ],
        a: 2,
        w: "p = e^z / Σe^z → 약 [0.79, 0.11, 0.11]. 합은 항상 1입니다.",
        an: "D5-6 · softmax 막대"
      },
      {
        ty: "ox",
        p: "학습 전 모델이 10개 클래스를 고르게 찍으면 cross-entropy 손실은 약 log 10 ≈ 2.30입니다.",
        a: true,
        w: "p_y = 0.1 → −log 0.1 = 2.30. 노트북 학습 전 val loss가 이 근처입니다.",
        an: "Part 4 학습 전 출력"
      },
      {
        ty: "multi",
        p: "cross-entropy 손실 L = −log p_y에 대해 옳은 것을 모두 고르세요.",
        o: [
          "정답 확률 p_y가 1이면 손실은 0이다",
          "확신 있게 틀릴수록(p_y가 0에 가까울수록) 손실이 크다",
          "logit에 대한 기울기는 p − onehot이다",
          "손실이 클수록 좋은 모델이다"
        ],
        a: [0, 1, 2],
        w: "손실은 작을수록 좋습니다. 기울기 p − onehot은 노트북에서 autograd로 확인했습니다.",
        an: "빈칸 실습 5"
      },
      {
        ty: "mc",
        p: "logit 모양이 (B, 10)일 때 softmax 분모의 합은 어느 차원으로 해야 합니까?",
        o: [
          "dim=0 (배치 방향)",
          "모든 원소",
          "차원 상관없음",
          "dim=1 (클래스 방향)"
        ],
        a: 3,
        w: "각 샘플(행) 안에서 10개 클래스의 합이 1이 되어야 합니다.",
        an: "빈칸 실습 5"
      }
    ]
  },
  {
    t: "3교시 · 학습 루프 · 평가 · 혼동 행렬",
    anim: "D5-7 경사 하강법 · 학습 곡선 · D5-8 혼동 행렬",
    qs: [
      {
        ty: "mc",
        p: "경사 하강법의 파라미터 업데이트 식은?",
        o: [
          "θ ← θ + η∇L",
          "θ ← θ − η∇L",
          "θ ← η∇L",
          "θ ← θ · ∇L"
        ],
        a: 1,
        w: "기울기의 반대 방향으로 학습률 η만큼 움직여 손실을 줄입니다.",
        an: "D5-7 · 수식 줄"
      },
      {
        ty: "match",
        p: "학습률 η와 결과를 이으세요.",
        left: ["너무 작음", "적당함", "너무 큼"],
        right: [
          "골짜기를 넘어가며 발산",
          "아주 천천히 내려감",
          "빠르게 수렴"
        ],
        a: [1, 2, 0],
        w: "Adam은 보통 1e-3에서 잘 시작합니다.",
        an: "D5-7 · 학습률 슬라이더"
      },
      {
        ty: "order",
        p: "학습 한 걸음(step)의 순서대로 놓으세요.",
        steps: [
          "loss.backward()",
          "logits = model(xb)",
          "opt.step()",
          "loss = F.cross_entropy(logits, yb)",
          "opt.zero_grad()"
        ],
        a: [1, 3, 4, 0, 2],
        w: "forward → loss → 기울기 지우기 → backward → step.",
        an: "빈칸 실습 6"
      },
      {
        ty: "mc",
        p: "opt.zero_grad()를 빼먹으면 어떻게 됩니까?",
        o: [
          "모델이 GPU로 옮겨진다",
          "학습률이 0이 된다",
          "아무 영향이 없다",
          "이전 배치의 기울기가 누적되어 업데이트가 엉망이 된다"
        ],
        a: 3,
        w: "PyTorch는 .grad에 기울기를 더해 가므로 매 걸음 지워야 합니다.",
        an: "빈칸 실습 6 해설"
      },
      {
        ty: "ox",
        p: "평가할 때는 model.eval()로 바꿔 Dropout을 끄고, BatchNorm이 저장된 통계를 쓰게 해야 합니다.",
        a: true,
        w: "학습 · 평가 모드에서 두 층의 동작이 다릅니다. torch.no_grad()로 기울기 계산도 끕니다.",
        an: "학습 루프 코드 해설"
      },
      {
        ty: "mc",
        p: "train 손실은 계속 내려가는데 val 손실이 어느 순간부터 다시 올라갑니다. 무슨 상태입니까?",
        o: [
          "과적합 (학습 데이터를 외우는 중)",
          "과소적합",
          "학습률이 0",
          "데이터 누수 없음"
        ],
        a: 0,
        w: "데이터 증강, Dropout, 조기 종료로 대응합니다.",
        an: "D5-7 · 학습 곡선 · 노트북 4-2 표"
      },
      {
        ty: "mc",
        p: "혼동 행렬(행 = 정답, 열 = 예측)에서 클래스 k의 재현율(recall)은?",
        o: [
          "C[k,k] / 열 k의 합",
          "C[k,k] / 행 k의 합",
          "대각합 / 전체",
          "C[k,k] / 전체"
        ],
        a: 1,
        w: "진짜 k 중 맞힌 비율 = 행 기준. 정밀도는 열 기준입니다.",
        an: "D5-8 · 초록 행"
      },
      {
        ty: "ox",
        p: "정밀도(precision)는 '모델이 k라고 예측한 것 중 진짜 k의 비율'입니다.",
        a: true,
        w: "열 k의 합으로 나눕니다. 깨우기 단어의 오작동과 관련 있습니다.",
        an: "D5-8 · 주황 열"
      },
      {
        ty: "multi",
        p: "테스트 세트에 대한 설명으로 옳은 것을 모두 고르세요.",
        o: [
          "학습에 쓰지 않은 화자들의 데이터다",
          "최종 성적표로 쓴다",
          "학습 중 설정(epoch, 학습률)을 고르는 데 반복해서 쓴다",
          "검증 세트와 화자가 겹치지 않는다"
        ],
        a: [0, 1, 3],
        w: "설정을 고를 때는 검증 세트를 씁니다. 테스트를 반복해서 보면 테스트에 맞춰 버리게 됩니다.",
        an: "Part 5 도입"
      },
      {
        ty: "mc",
        p: "logits.argmax(dim=1)이 돌려주는 것은?",
        o: [
          "가장 큰 점수 값",
          "확률",
          "샘플마다 가장 큰 점수의 클래스 번호",
          "손실"
        ],
        a: 2,
        w: "softmax는 순서를 바꾸지 않으므로 예측만 필요하면 logit에서 바로 argmax합니다.",
        an: "빈칸 실습 7"
      }
    ]
  },
  {
    t: "4교시 · SpecAugment · 미니 프로젝트",
    anim: "D5-9 SpecAugment",
    qs: [
      {
        ty: "mc",
        p: "SpecAugment가 Log-Mel에 하는 일은?",
        o: [
          "샘플링 레이트를 바꾼다",
          "주파수 띠와 시간 구간을 무작위로 가린다",
          "잡음을 제거한다",
          "클래스 수를 늘린다"
        ],
        a: 1,
        w: "FrequencyMasking과 TimeMasking. 모델이 한 단서에만 기대지 않게 합니다.",
        an: "D5-9 · 🎲"
      },
      {
        ty: "ox",
        p: "SpecAugment는 평가와 예측 때도 켜 두어야 학습 때와 조건이 같아집니다.",
        a: false,
        w: "증강은 학습 때만 씁니다. 평가 · 예측에는 원본 입력을 넣습니다.",
        an: "노트북 6-1"
      },
      {
        ty: "match",
        p: "torchaudio 클래스와 하는 일을 이으세요.",
        left: [
          "T.MelSpectrogram",
          "T.AmplitudeToDB",
          "T.FrequencyMasking",
          "T.TimeMasking"
        ],
        right: [
          "시간 축의 연속 구간을 가림",
          "파형 → mel 파워 스펙트로그램",
          "주파수 축의 연속 띠를 가림",
          "파워 → dB (10·log10)"
        ],
        a: [1, 3, 2, 0],
        w: "앞의 둘은 특징 추출, 뒤의 둘은 증강입니다.",
        an: "Part 2 · Part 6"
      },
      {
        ty: "mc",
        p: "SpecAugment를 켜고 같은 epoch만큼 학습했을 때 흔히 보이는 변화는?",
        o: [
          "학습 정확도는 조금 낮아지고 train − val 차이(과적합)가 줄어든다",
          "학습 정확도가 반드시 100%가 된다",
          "검증 정확도가 반드시 크게 떨어진다",
          "파라미터 수가 늘어난다"
        ],
        a: 0,
        w: "학습 데이터가 매번 조금씩 달라 보여 외우기 어려워집니다.",
        an: "빈칸 실습 8"
      },
      {
        ty: "mc",
        p: "predict_keyword()에서 Log-Mel을 정규화할 때 써야 하는 값은?",
        o: [
          "그 파일 하나의 평균과 표준편차",
          "0과 1",
          "테스트 세트의 μ, σ",
          "학습 세트의 μ, σ (MU, SD)"
        ],
        a: 3,
        w: "학습 때와 예측 때의 전처리가 다르면 성능이 크게 떨어집니다.",
        an: "빈칸 실습 9"
      },
      {
        ty: "order",
        p: "predict_keyword()의 처리 순서대로 놓으세요.",
        steps: [
          "F.softmax → top-3",
          "librosa.load(sr=16000)",
          "학습 세트 μ, σ로 정규화",
          "center_1s: 무음 자르고 1초 맞추기",
          "wav2feat: Log-Mel"
        ],
        a: [1, 3, 4, 2, 0],
        w: "읽기 → 1초 맞추기 → Log-Mel → 정규화 → 모델 · softmax.",
        an: "노트북 6-2 표"
      },
      {
        ty: "ox",
        p: "모델을 저장할 때 가중치(state_dict)와 함께 μ, σ, 키워드 목록을 저장하면 다른 곳에서도 같은 전처리로 예측할 수 있습니다.",
        a: true,
        w: "kws_cnn.pt에 state_dict, keywords, mu, sd, 설정을 함께 넣었습니다.",
        an: "저장 셀"
      },
      {
        ty: "mc",
        p: "gTTS 음성으로 시험했을 때 일부 단어를 틀리는 가장 그럴듯한 이유는?",
        o: [
          "GPU가 없어서",
          "파라미터가 너무 많아서",
          "TTS 목소리가 학습 데이터(사람 녹음)와 분포가 달라서",
          "softmax를 써서"
        ],
        a: 2,
        w: "학습 때 보지 못한 조건(목소리, 녹음 환경)에서는 성능이 떨어집니다. 데이터 다양성과 증강이 중요한 이유입니다.",
        an: "미니 프로젝트 gTTS 셀"
      },
      {
        ty: "multi",
        p: "키워드 인식 모델의 성능을 높이는 방법으로 알맞은 것을 모두 고르세요.",
        o: [
          "학습 데이터(화자 · 환경)를 늘린다",
          "SpecAugment 같은 데이터 증강을 쓴다",
          "val 손실이 다시 오르기 전에 멈춘다 (조기 종료)",
          "테스트 세트로 학습한다"
        ],
        a: [0, 1, 2],
        w: "테스트 데이터를 학습에 쓰면 성능을 제대로 잴 수 없게 됩니다.",
        an: "Part 4 · Part 6"
      },
      {
        ty: "mc",
        p: "오늘 만든 KWSNet의 전체 파라미터 수에 가장 가까운 것은?",
        o: [
          "약 600개",
          "약 600만 개",
          "약 6억 개",
          "약 6만 개"
        ],
        a: 3,
        w: "61,226개, float32로 약 240 KB. 휴대폰에서도 실시간으로 돌릴 수 있는 크기입니다.",
        an: "D5-5 · 수식 검증 1"
      }
    ]
  }
];
