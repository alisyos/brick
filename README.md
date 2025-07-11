# 어휘 벽돌깨기 게임

어휘 학습과 게임을 결합한 교육용 웹 어플리케이션입니다. 고전적인 벽돌깨기 게임에 어휘 학습 요소를 추가하여 재미있게 학습할 수 있습니다.

## 게임 특징

- **교육과 게임의 결합**: 단어의 뜻을 맞추면 공이 자동으로 해당 단어가 적힌 벽돌을 향해 날아가 파괴합니다.
- **난이도별 학습**: 세 단계의 난이도(쉬움, 중간, 어려움)로 구분된 어휘를 학습할 수 있습니다.
- **시각적 피드백**: 정답/오답에 따른 즉각적인 피드백을 제공합니다.
- **OpenAI GPT API 연동**: 다양한 주제의 단어를 자동으로 생성하고, 사용자의 답변을 의미적으로 평가합니다.

## 게임 방법

1. **게임 시작**: '게임 시작' 버튼을 클릭합니다.
2. **학습 모드 선택**: AI 모드를 선택하거나 기본 단어로 시작할 수 있습니다.
3. **단어 학습**: 화면에 표시되는 단어의 뜻을 입력창에 입력하고 '제출' 버튼을 클릭하거나 Enter 키를 누릅니다.
4. **정답 시**: 입력한 뜻이 정답이면 공이 자동으로 해당 단어 벽돌을 향해 날아가 파괴합니다.
5. **오답 시**: 잘못된 뜻을 입력하면 생명이 하나 감소합니다.
6. **패들 조작**: 왼쪽/오른쪽 화살표 키를 사용하여 패들을 조작할 수 있습니다.

## 서버 설정 및 API 기능

- **서버 기반 API 처리**: OpenAI API 키는 서버에 안전하게 저장되며, 클라이언트는 서버를 통해 API를 호출합니다.
- **자동 단어 생성**: 선택한 주제(수학, 과학, 영어, 역사)에 맞는 단어와 정의를 자동으로 생성합니다.
- **의미적 답변 평가**: 사용자의 답변이 정확히 일치하지 않더라도, 의미적으로 올바른 경우 정답으로 인정합니다.
- **기본 단어 모드**: 서버가 연결되지 않아도 기본 내장된 단어 세트로 게임을 즐길 수 있습니다.

## 서버 설치 및 실행 방법

1. 모든 파일을 같은 디렉토리에 저장합니다.
2. OpenAI API 키를 준비합니다.
3. 'config.env.example' 파일을 복사하여 '.env' 파일을 만들고 API 키를 입력합니다:
   ```
   PORT=3000
   OPENAI_API_KEY=your_api_key_here
   ```
4. 터미널에서 다음 명령어를 실행하여 필요한 패키지를 설치합니다:
   ```
   npm install
   ```
5. 서버를 시작합니다:
   ```
   npm start
   ```
6. 웹 브라우저에서 `http://localhost:3000`으로 접속합니다.

## 현재 어휘 세트 (기본 모드)

기본 게임 모드는 수학 관련 어휘를 포함하고 있습니다:

- **쉬운 단어**: 수, 약수, 배수, 자연수, 정수
- **중간 단어**: 소수, 합성수, 인수, 공약수, 공배수
- **어려운 단어**: 소인수, 최대공약수, 최소공배수, 서로소, 지수

## AI 모드에서 지원하는 주제

- **수학**: 수학 관련 용어와 정의
- **과학**: 과학 관련 용어와 정의
- **영어**: 영어 단어와 한국어 의미
- **역사**: 역사 관련 용어와 정의

## 확장 가능성

- 다양한 게임 모드 및 난이도 조절 기능 추가 가능
- 사용자 맞춤형 단어 세트 저장 및 불러오기 기능
- 멀티플레이어 모드 및 학습 진도 추적 기능 