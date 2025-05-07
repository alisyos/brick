// 문서가 완전히 로드된 후 게임 초기화 실행
window.onload = function() {
    console.log('윈도우 완전히 로드됨 - 모든 리소스가 로드되었습니다');
    
    // 이중 확인을 위한 DOM 요소 유효성 체크
    const wordElement = document.getElementById('word-display');
    if (wordElement) {
        console.log('word-display 요소 확인됨:', wordElement);
        console.log('초기 내용:', wordElement.textContent);
        
        // 글로벌 변수 설정
        targetWordElement = wordElement;
    } else {
        console.error('word-display 요소를 찾을 수 없음');
    }
    
    // 지연 초기화
    setTimeout(function() {
        console.log('지연 초기화 시작');
        initializeGame();
    }, 500); // 500ms 지연
};

// 게임 요소
let canvas, ctx, startButton, wordPrompt, targetWordElement,
    answerInput, submitAnswerButton, scoreElement, livesElement,
    apiSetup, topicSelect, startWithApiButton, startWithDefaultButton, loadingScreen;

// 서버 API 기본 URL
const API_BASE_URL = 'http://localhost:3000/api';

// 게임 상태 변수
let gameStarted = false;
let score = 0;
let lives = 3;
let animationFrameId;
let useGptApi = false;
let selectedTopic = 'math';
let lastAnswerExplanation = '';

// 전역 targetBrick 객체 - 항상 접근 가능하도록
window.targetBrick = null;

// 패들 관련 변수
const paddleHeight = 15;
const paddleWidth = 100;
let paddleX = 0;
let rightPressed = false;
let leftPressed = false;
const paddleSpeed = 7;

// 공 관련 변수
const ballRadius = 10;
let ballX = 0;
let ballY = 0;
let ballSpeedX = 0;
let ballSpeedY = 0;
const initialBallSpeed = 5;
let targetBrick = null;
let ballInMotion = false;

// 시각 효과 변수
let particleEffects = [];
let brickHighlightEffect = null;

// 벽돌 관련 변수
const brickRowCount = 3;  // 난이도별 행 (쉬움, 중간, 어려움)
const brickColumnCount = 5;
const brickWidth = 125;
const brickHeight = 40;
const brickPadding = 20;
const brickOffsetTop = 60;
const brickOffsetLeft = 45;
const brickColors = ['#38b000', '#ff9e00', '#d00000']; // 난이도별 색상

// 현재 게임에서 사용할 어휘 데이터
let vocabularyData = [];

// 벽돌 객체 초기화
let bricks = [];

// 키보드 입력 처리 함수
function keyDownHandler(e) {
    if(e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if(e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if(e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if(e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}

// DOM 요소 초기화 및 이벤트 리스너 설정
function initializeGame() {
    console.log('게임 초기화 시작...');
    
    // DOM 요소 참조 가져오기
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas 요소를 찾을 수 없습니다!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    startButton = document.getElementById('start-game');
    wordPrompt = document.getElementById('word-prompt');
    targetWordElement = document.getElementById('word-display');
    loadingScreen = document.getElementById('loading-screen');
    
    if (!targetWordElement) {
        console.error('word-display 요소를 찾을 수 없습니다!');
    } else {
        console.log('word-display 요소 찾음:', targetWordElement);
        console.log('초기 단어 텍스트:', targetWordElement.textContent);
    }
    
    answerInput = document.getElementById('answer-input');
    submitAnswerButton = document.getElementById('submit-answer');
    scoreElement = document.getElementById('score');
    livesElement = document.getElementById('lives');
    
    // API 설정 요소
    apiSetup = document.getElementById('api-setup');
    topicSelect = document.getElementById('topic-select');
    startWithApiButton = document.getElementById('start-with-api');
    startWithDefaultButton = document.getElementById('start-with-default');
    
    // 캔버스 관련 초기화
    paddleX = (canvas.width - paddleWidth) / 2;
    ballX = canvas.width / 2;
    ballY = canvas.height - 30;
    
    // 이벤트 리스너 등록
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    startButton.addEventListener('click', () => {
        apiSetup.classList.remove('hidden');
    });
    submitAnswerButton.addEventListener('click', checkAnswer);
    startWithApiButton.addEventListener('click', startGameWithApi);
    startWithDefaultButton.addEventListener('click', startGameWithDefault);
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
    
    // 서버 연결 테스트
    testServerConnection().then(isConnected => {
        console.log('서버 연결 상태:', isConnected ? '연결됨' : '연결 안됨');
    });
    
    // 초기 화면 표시
    drawInitialScreen();
    
    // API 설정 화면은 처음에는 숨김
    apiSetup.classList.add('hidden');
    
    console.log('게임 초기화 완료');
}

// 단어 데이터 (기본값)
const defaultVocabularyData = [
    // 쉬운 단어 (첫 번째 행)
    [
        { word: '수', definition: '셈의 기본 대상' },
        { word: '약수', definition: '어떤 수를 나누어 떨어지게 하는 수' },
        { word: '배수', definition: '어떤 수의 배수가 되는 수' },
        { word: '자연수', definition: '셈을 할 때 쓰는 1, 2, 3, ...과 같은 수' },
        { word: '정수', definition: '소수점이 없는 모든 수' }
    ],
    // 중간 난이도 단어 (두 번째 행)
    [
        { word: '소수', definition: '1과 자기 자신만을 약수로 가지는 1보다 큰 자연수' },
        { word: '합성수', definition: '1과 자기 자신 이외의 약수를 가지는 자연수' },
        { word: '인수', definition: '어떤 수나 식을 두 개 이상의 수나 식의 곱으로 나타낼 때, 각각의 수나 식' },
        { word: '공약수', definition: '둘 이상의 수의 공통된 약수' },
        { word: '공배수', definition: '둘 이상의 수의 공통된 배수' }
    ],
    // 어려운 단어 (세 번째 행) - 주요 어휘 줄
    [
        { word: '소인수', definition: '수를 소수들의 곱으로 나타낼 때 각각의 소수' },
        { word: '최대공약수', definition: '두 수 이상의 공약수 중에서 가장 큰 수' },
        { word: '최소공배수', definition: '두 수 이상의 공배수 중에서 가장 작은 수' },
        { word: '서로소', definition: '공약수가 1뿐인 두 수의 관계' },
        { word: '지수', definition: '거듭제곱에서 밑을 몇 번 곱할지를 나타내는 수' }
    ]
];

// 서버 연결 테스트 함수
async function testServerConnection() {
    try {
        const response = await axios.get(`${API_BASE_URL}/status`);
        return response.status === 200;
    } catch (error) {
        console.error('서버 연결 실패:', error);
        return false;
    }
}

// 초기 화면 그리기 함수
function drawInitialScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "30px 'Noto Sans KR'";
    ctx.fillStyle = "#4361ee";
    ctx.textAlign = "center";
    ctx.fillText("어휘 벽돌깨기", canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = "16px 'Noto Sans KR'";
    ctx.fillText("시작 버튼을 눌러 게임을 시작하세요.", canvas.width / 2, canvas.height / 2);
    ctx.fillText("키보드 좌우 화살표로 패들을 움직입니다.", canvas.width / 2, canvas.height / 2 + 30);
}

// API로 게임 시작 함수
async function startGameWithApi() {
    selectedTopic = topicSelect.value;
    useGptApi = true;
    
    // 로딩 화면 표시
    document.getElementById('loading-message-text').textContent = 'AI가 단어를 준비하고 있어요...';
    document.getElementById('api-action').textContent = '단어 데이터를 불러오는 중...';
    document.getElementById('api-action').classList.remove('hidden');
    loadingScreen.classList.remove('hidden');
    
    try {
        console.log('API 요청 시작: 주제 =', selectedTopic);
        const response = await axios.post(`${API_BASE_URL}/vocabulary`, {
            topic: selectedTopic
        });
        
        console.log('API 응답 받음:', response.status);
        console.log('응답 데이터 구조:', Object.keys(response.data));
        
        if (response.data && response.data.data) {
            console.log('단어 데이터 확인:');
            console.log('- 데이터 타입:', typeof response.data.data);
            console.log('- 배열 길이:', Array.isArray(response.data.data) ? response.data.data.length : '배열 아님');
            if (Array.isArray(response.data.data) && response.data.data.length > 0) {
                console.log('- 첫 번째 행 타입:', typeof response.data.data[0]);
                console.log('- 첫 번째 행 길이:', Array.isArray(response.data.data[0]) ? response.data.data[0].length : '배열 아님');
                
                // 샘플 단어 출력
                if (Array.isArray(response.data.data[0]) && response.data.data[0].length > 0) {
                    console.log('샘플 단어 데이터:');
                    console.log(JSON.stringify(response.data.data[0][0], null, 2));
                }
            }
            
            vocabularyData = response.data.data;
            console.log('vocabularyData 설정 완료');
            
            // 로딩 화면 숨기기
            loadingScreen.classList.add('hidden');
            document.getElementById('api-action').classList.add('hidden');
            
            // 기존 게임 루프가 있다면 중단
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            startGame();
        } else {
            console.error('API 응답이 올바른 형식이 아닙니다:', response.data);
            alert('단어를 불러오는 데 실패했습니다. 기본 단어로 시작합니다.');
            vocabularyData = defaultVocabularyData;
            
            // 로딩 화면 숨기기
            loadingScreen.classList.add('hidden');
            document.getElementById('api-action').classList.add('hidden');
            
            // 기존 게임 루프가 있다면 중단
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            startGame();
        }
    } catch (error) {
        console.error('API 오류:', error);
        alert('단어를 불러오는 데 실패했습니다. 기본 단어로 시작합니다.');
        vocabularyData = defaultVocabularyData;
        
        // 로딩 화면 숨기기
        loadingScreen.classList.add('hidden');
        document.getElementById('api-action').classList.add('hidden');
        
        // 기존 게임 루프가 있다면 중단
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        startGame();
    }
}

// AI 사용 여부 표시 함수
function updateAiIndicator() {
    const footer = document.querySelector('.game-footer');
    const existingIndicator = document.getElementById('ai-indicator');
    
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const aiIndicator = document.createElement('div');
    aiIndicator.id = 'ai-indicator';
    aiIndicator.style.marginTop = '10px';
    aiIndicator.style.fontSize = '14px';
    aiIndicator.style.color = useGptApi ? '#7209b7' : '#adb5bd';
    aiIndicator.style.padding = '5px 10px';
    aiIndicator.style.borderRadius = '20px';
    aiIndicator.style.display = 'inline-block';
    aiIndicator.style.background = useGptApi ? 'rgba(114, 9, 183, 0.1)' : 'transparent';
    
    if (useGptApi) {
        aiIndicator.innerHTML = '🤖 AI 정답 검증 활성화';
        aiIndicator.style.border = '1px solid rgba(114, 9, 183, 0.3)';
    } else {
        aiIndicator.innerHTML = '📝 기본 정답 검증 사용 중';
        aiIndicator.style.border = '1px solid transparent';
    }
    
    footer.appendChild(aiIndicator);
}

// 기본 데이터로 게임 시작 함수
function startGameWithDefault() {
    useGptApi = false;
    vocabularyData = defaultVocabularyData;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    startGame();
}

// 정답 확인 함수
function checkAnswer() {
    console.log('정답 확인 시작');
    
    // 여러 방법으로 targetBrick 가져오기 시도
    let currentTargetBrick = null;
    
    // 방법 1: 로컬 변수
    if (targetBrick && targetBrick.word && targetBrick.definition) {
        currentTargetBrick = targetBrick;
        console.log('로컬 targetBrick 사용:', targetBrick.word);
    } 
    // 방법 2: 전역 변수
    else if (window.targetBrick && window.targetBrick.word && window.targetBrick.definition) {
        currentTargetBrick = window.targetBrick;
        console.log('전역 targetBrick 사용:', window.targetBrick.word);
    }
    // 방법 3: 가장 최근에 비활성화 되지 않은 brick 찾기
    else {
        console.warn('targetBrick을 찾을 수 없음, 활성 벽돌 검색 시도...');
        // 활성 벽돌 중에서 찾기
        for (let r = 0; r < brickRowCount; r++) {
            for (let c = 0; c < brickColumnCount; c++) {
                if (bricks[r][c] && bricks[r][c].status === 1) {
                    currentTargetBrick = bricks[r][c];
                    break;
                }
            }
            if (currentTargetBrick) break;
        }
    }
    
    if (!currentTargetBrick) {
        console.error('targetBrick이 없습니다! 정답 확인 불가');
        alert('문제를 찾을 수 없습니다. 다시 시도해주세요.');
        return;
    }
    
    console.log('현재 targetBrick:', currentTargetBrick);
    console.log('현재 단어:', currentTargetBrick.word);
    console.log('현재 정의:', currentTargetBrick.definition);
    
    const userAnswer = answerInput.value.trim().toLowerCase();
    const correctAnswer = currentTargetBrick.definition.toLowerCase();
    
    console.log('사용자 입력:', userAnswer);
    console.log('정답:', correctAnswer);
    
    // API를 사용하지 않는 경우 로컬 체크
    if (!useGptApi) {
        console.log('API 사용 안함, 로컬 체크로 진행');
        fallbackAnswerCheck(userAnswer, correctAnswer, currentTargetBrick);
        return;
    }
    
    // 로딩 화면 표시
    document.getElementById('loading-message-text').textContent = '정답을 확인하고 있어요...';
    document.getElementById('api-action').textContent = 'AI가 답변의 정확성을 검증 중...';
    document.getElementById('api-action').classList.remove('hidden');
    loadingScreen.classList.remove('hidden');
    
    // API를 통한 정답 확인
    axios.post(`${API_BASE_URL}/check-answer`, {
        word: currentTargetBrick.word,
        definition: currentTargetBrick.definition,
        userAnswer: userAnswer
    })
    .then(response => {
        // 로딩 화면 숨기기
        loadingScreen.classList.add('hidden');
        document.getElementById('api-action').classList.add('hidden');
        
        if (response.data && response.data.success) {
            const isCorrect = response.data.isCorrect;
            console.log('GPT 정답 확인 결과:', isCorrect);
            
            // 설명이 있다면 저장
            if (response.data.explanation) {
                lastAnswerExplanation = response.data.explanation;
                console.log('API 설명:', lastAnswerExplanation);
            }
            
            if (isCorrect) {
                // 정답인 경우
                score += 10;
                scoreElement.textContent = score;
                console.log('점수 증가:', score);
                
                // 벽돌은 제거하지 않고 공을 발사
                aimBallAtBrick(currentTargetBrick);
                
                // 단어 프롬프트 숨기기
                wordPrompt.classList.add('hidden');
                answerInput.value = '';
                
                // 게임 다시 시작 (공을 움직이게 함)
                ballInMotion = true;
            } else {
                // 오답인 경우
                answerInput.classList.add('shake');
                setTimeout(() => {
                    answerInput.classList.remove('shake');
                }, 500);
                
                // 설명이 있으면 알림과 함께 표시
                if (lastAnswerExplanation) {
                    alert(`틀렸습니다! 다시 시도하세요.\n\n${lastAnswerExplanation}`);
                } else {
                    alert('틀렸습니다! 다시 시도하세요.');
                }
            }
        } else {
            // API 응답 실패 시 기존 방식으로 체크 (fallback)
            console.warn('API 응답 실패, 로컬 체크로 대체합니다');
            fallbackAnswerCheck(userAnswer, correctAnswer, currentTargetBrick);
        }
    })
    .catch(error => {
        console.error('정답 확인 API 오류:', error);
        // 로딩 화면 숨기기
        loadingScreen.classList.add('hidden');
        document.getElementById('api-action').classList.add('hidden');
        // API 오류 시 기존 방식으로 체크 (fallback)
        fallbackAnswerCheck(userAnswer, correctAnswer, currentTargetBrick);
    });
}

// API 호출 실패 시 로컬에서 정답 확인하는 fallback 함수
function fallbackAnswerCheck(userAnswer, correctAnswer, currentTargetBrick) {
    console.log('로컬 정답 확인 수행');
    
    // 정답 체크 (포함 여부와 유사도 확인)
    // 1. 완전 일치 체크
    const exactMatch = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
    
    // 2. 포함 관계 체크
    const inclusionMatch = correctAnswer.toLowerCase().includes(userAnswer.toLowerCase()) || 
                          userAnswer.toLowerCase().includes(correctAnswer.toLowerCase());
    
    // 3. 단어 단위 일치도 체크
    const userWords = userAnswer.toLowerCase().split(/\s+/);
    const correctWords = correctAnswer.toLowerCase().split(/\s+/);
    let matchingWords = 0;
    
    userWords.forEach(userWord => {
        if (correctWords.some(correctWord => correctWord.includes(userWord) || userWord.includes(correctWord))) {
            matchingWords++;
        }
    });
    
    const wordMatchRatio = userWords.length > 0 ? matchingWords / userWords.length : 0;
    
    // 최종 판단 (완전 일치, 포함 관계, 또는 80% 이상의 단어 일치)
    const isCorrect = exactMatch || inclusionMatch || wordMatchRatio >= 0.8;
    
    console.log('로컬 정답 확인 분석:');
    console.log('- 완전 일치:', exactMatch);
    console.log('- 포함 관계:', inclusionMatch);
    console.log('- 단어 일치율:', wordMatchRatio);
    console.log('로컬 정답 확인 결과:', isCorrect);
    
    // 설명 추가
    let explanation = '';
    if (exactMatch) {
        explanation = '입력하신 정의가 정확히 일치합니다.';
    } else if (inclusionMatch) {
        explanation = '입력하신 정의가 정답을 포함하거나 정답에 포함됩니다.';
    } else if (wordMatchRatio >= 0.8) {
        explanation = '입력하신 정의의 핵심 단어들이 정답과 일치합니다.';
    } else {
        explanation = '입력하신 정의가 정답과 충분히 일치하지 않습니다.';
    }
    
    lastAnswerExplanation = explanation;
    
    if (isCorrect) {
        // 정답인 경우
        score += 10;
        scoreElement.textContent = score;
        console.log('점수 증가:', score);
        
        // 벽돌은 제거하지 않고 공을 발사
        aimBallAtBrick(currentTargetBrick);
        
        // 단어 프롬프트 숨기기
        wordPrompt.classList.add('hidden');
        answerInput.value = '';
        
        // 게임 다시 시작 (공을 움직이게 함)
        ballInMotion = true;
    } else {
        // 오답인 경우
        answerInput.classList.add('shake');
        setTimeout(() => {
            answerInput.classList.remove('shake');
        }, 500);
        
        // 설명이 있으면 알림과 함께 표시
        alert(`틀렸습니다! 다시 시도하세요.\n\n${explanation}`);
    }
}

// 파티클 효과 생성 함수
function createParticleEffect(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        const size = 2 + Math.random() * 3;
        const lifetime = 30 + Math.random() * 30;
        
        particleEffects.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: size,
            color: color,
            lifetime: lifetime,
            maxLifetime: lifetime
        });
    }
}

// 공을 특정 벽돌을 향해 조준하는 함수
function aimBallAtBrick(brick) {
    // 공의 위치가 패들 위에 있도록 설정
    ballX = paddleX + paddleWidth / 2;
    ballY = canvas.height - paddleHeight - ballRadius - 5;
    
    // 벽돌 중심점 계산
    const brickCenterX = brick.x + brickWidth / 2;
    const brickCenterY = brick.y + brickHeight / 2;
    
    // 공을 벽돌 방향으로 조준
    const angle = Math.atan2(brickCenterY - ballY, brickCenterX - ballX);
    ballSpeedX = initialBallSpeed * Math.cos(angle);
    ballSpeedY = initialBallSpeed * Math.sin(angle);
}

// 게임 시작 함수
function startGame() {
    // 기존 게임 루프가 있다면 중단
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // 게임 상태 초기화
    gameStarted = true;
    score = 0;
    lives = 3;
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    // API 설정 패널 숨기기
    apiSetup.classList.add('hidden');
    // 버튼 상태 업데이트 (disabled 제거)
    startButton.disabled = false;
    // AI 사용 여부 표시
    updateAiIndicator();
    // 벽돌 초기화
    initializeBricks();
    // 공과 패들 초기화
    resetBall();
    paddleX = (canvas.width - paddleWidth) / 2;
    // 게임 시작 시 첫 번째 단어 선택 (쉬운 단어부터 시작)
    console.log('게임 시작 - 첫 번째 단어 선택');
    if (bricks[2] && bricks[2][0] && bricks[2][0].status === 1) {
        targetBrick = bricks[2][0];
        window.targetBrick = targetBrick;
        try {
            document.getElementById('word-display').innerHTML = targetBrick.word;
            const wordPromptEl = document.getElementById('word-prompt');
            wordPromptEl.classList.remove('hidden');
            const debugEl = document.getElementById('current-word-debug');
            if (debugEl) debugEl.textContent = targetBrick.word;
            ballInMotion = false;
            setTimeout(() => {
                const answerInput = document.getElementById('answer-input');
                if (answerInput) answerInput.focus();
            }, 100);
            console.log('단어 표시 성공: ' + targetBrick.word);
        } catch (err) {
            console.error('단어 표시 오류: ' + err.message);
        }
    } else {
        selectRandomBrick();
    }
    // 게임 루프 시작
    requestAnimationFrame(gameLoop);
}

// 벽돌 초기화 함수
function initializeBricks() {
    bricks = [];
    console.log('벽돌 초기화 시작');
    console.log('vocabularyData 원본:', JSON.stringify(vocabularyData));
    console.log('vocabularyData 타입:', typeof vocabularyData);
    console.log('vocabularyData 길이:', Array.isArray(vocabularyData) ? vocabularyData.length : '배열 아님');
    
    // vocabularyData 구조 정규화
    let normalizedData = [];
    
    // 데이터를 3행 5열 구조로 정규화
    if (Array.isArray(vocabularyData)) {
        // 서버에서 반환된 데이터가 [행1, 행2, 행3] 구조인 경우
        if (vocabularyData.length > 0 && Array.isArray(vocabularyData[0])) {
            // 순서를 반대로 변경 (어려운 단어가 위로 가도록)
            normalizedData = vocabularyData.slice().reverse();
            console.log('데이터 구조: 정상 [행][열] 구조 (역순으로 변경됨)');
        } 
        // 서버에서 반환된 데이터가 [단어객체, 단어객체, ...] 구조인 경우 (1차원 배열)
        else if (vocabularyData.length > 0 && typeof vocabularyData[0] === 'object') {
            // 난이도별로 분류
            const totalWords = vocabularyData.length;
            const wordsPerRow = Math.ceil(totalWords / 3);
            
            for (let r = 0; r < 3; r++) {
                normalizedData[r] = [];
                for (let c = 0; c < 5 && (r * 5 + c < totalWords); c++) {
                    const idx = r * wordsPerRow + c;
                    if (idx < totalWords) {
                        normalizedData[r][c] = vocabularyData[idx];
                    }
                }
            }
            // 순서 반대로 변경
            normalizedData.reverse();
            console.log('데이터 구조: 1차원 배열을 행/열 구조로 변환 (역순으로 변경됨)');
        } else {
            console.log('알 수 없는 데이터 구조, 기본값 사용');
            // 기본값을 역순으로 변경
            normalizedData = defaultVocabularyData.slice().reverse();
        }
    } else {
        console.log('vocabularyData가 배열이 아님, 기본값 사용');
        // 기본값을 역순으로 변경
        normalizedData = defaultVocabularyData.slice().reverse();
    }
    
    // 정규화된 데이터 구조 확인
    console.log('정규화된 데이터:', JSON.stringify(normalizedData));
    
    for (let r = 0; r < brickRowCount; r++) {
        bricks[r] = [];
        for (let c = 0; c < brickColumnCount; c++) {
            const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
            const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
            
            // 정규화된 데이터에서 단어와 정의 가져오기
            let word = '단어';
            let definition = '정의';
            
            try {
                if (normalizedData[r] && normalizedData[r][c]) {
                    word = normalizedData[r][c].word || '단어';
                    definition = normalizedData[r][c].definition || '정의';
                    console.log(`벽돌 [${r}][${c}] 데이터:`, word, '-', definition);
                } else {
                    console.log(`벽돌 [${r}][${c}] 데이터 없음, 기본값 사용`);
                }
            } catch (e) {
                console.error(`벽돌 [${r}][${c}] 데이터 접근 오류:`, e);
            }
            
            bricks[r][c] = {
                x: brickX,
                y: brickY,
                status: 1,  // 1=존재, 0=제거됨
                word: word,
                definition: definition,
                difficulty: 2 - r  // 행 인덱스와 난이도를 반대로 설정 (0행이 어려운 단어, 2행이 쉬운 단어가 되도록)
            };
        }
    }
    console.log('벽돌 초기화 완료');
}

// 공 위치 초기화
function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height - 30;
    ballSpeedX = 0;
    ballSpeedY = 0;
    ballInMotion = false;
}

// 게임 루프
function gameLoop() {
    if (!gameStarted) return;
    
    // 화면 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 벽돌 그리기
    drawBricks();
    
    // 패들 그리기
    drawPaddle();
    
    // 공 그리기
    drawBall();
    
    // 충돌 감지
    detectCollisions();
    
    // 패들 이동
    movePaddle();
    
    // 공 이동
    if (ballInMotion) {
        ballX += ballSpeedX;
        ballY += ballSpeedY;
    } else {
        // 공이 움직이지 않는 상태라면 패들 위에 위치시킴
        ballX = paddleX + paddleWidth / 2;
        ballY = canvas.height - paddleHeight - ballRadius - 5;
    }
    
    // 다음 프레임 요청
    animationFrameId = requestAnimationFrame(gameLoop);
}

// 벽돌 그리기 함수
function drawBricks() {
    for (let r = 0; r < brickRowCount; r++) {
        for (let c = 0; c < brickColumnCount; c++) {
            const brick = bricks[r][c];
            if (brick && brick.status === 1) {
                // 그림자 효과
                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.fillRect(brick.x + 2, brick.y + 2, brickWidth, brickHeight);
                
                // 벽돌 그리기
                ctx.fillStyle = brickColors[brick.difficulty];
                ctx.fillRect(brick.x, brick.y, brickWidth, brickHeight);
                
                // 글로스 효과 (위쪽과 왼쪽에 밝은 선)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(brick.x, brick.y, brickWidth, 2);
                ctx.fillRect(brick.x, brick.y, 2, brickHeight);
                
                // 타겟 벽돌 강조
                if (targetBrick && targetBrick === brick) {
                    ctx.strokeStyle = "#FF0000";
                    ctx.lineWidth = 3;
                    ctx.strokeRect(brick.x, brick.y, brickWidth, brickHeight);
                    
                    // 깜빡임 효과
                    const glowIntensity = (Math.sin(Date.now() / 200) + 1) / 2;
                    ctx.strokeStyle = `rgba(255, 255, 255, ${glowIntensity * 0.8})`;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(brick.x + 3, brick.y + 3, brickWidth - 6, brickHeight - 6);
                }
                
                // 난이도 표시 (선택 사항)
                let difficultyLabel = "";
                if (brick.difficulty === 0) difficultyLabel = "쉬움";
                else if (brick.difficulty === 1) difficultyLabel = "중간";
                else if (brick.difficulty === 2) difficultyLabel = "어려움";
                
                // 벽돌 위에 단어 표시
                ctx.font = "14px 'Noto Sans KR'";
                ctx.fillStyle = "#FFF";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                
                // 텍스트에 그림자 추가
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 3;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;
                
                ctx.fillText(brick.word, brick.x + brickWidth/2, brick.y + brickHeight/2);
                
                // 그림자 초기화
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }
        }
    }
}

// 패들 그리기 함수
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

// 공 그리기 함수
function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

// 패들 이동 함수
function movePaddle() {
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += paddleSpeed;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= paddleSpeed;
    }
}

// 충돌 감지 함수
function detectCollisions() {
    // 벽과의 충돌
    if (ballX + ballSpeedX > canvas.width - ballRadius || ballX + ballSpeedX < ballRadius) {
        ballSpeedX = -ballSpeedX;
    }
    
    if (ballY + ballSpeedY < ballRadius) {
        ballSpeedY = -ballSpeedY;
    } else if (ballY + ballSpeedY > canvas.height - ballRadius) {
        // 패들과 충돌 체크
        if (ballX > paddleX && ballX < paddleX + paddleWidth) {
            // 패들에 부딪히면 위로 튕김
            ballSpeedY = -ballSpeedY;
            // 패들의 어느 부분에 맞았는지에 따라 X축 속도 조정
            const hitPoint = (ballX - (paddleX + paddleWidth/2)) / (paddleWidth/2);
            ballSpeedX = hitPoint * 5;
            // 공이 패들에 맞았을 때만 다음 단어로 진행
            selectRandomBrick();
            ballInMotion = false;
        } else {
            // 공을 놓쳐서 생명력 감소
            lives--;
            livesElement.textContent = lives;
            if (lives <= 0) {
                alert("게임 오버!");
                gameStarted = false;
                document.location.reload();
                return;
            } else {
                resetBall();
                paddleX = (canvas.width - paddleWidth) / 2;
                selectRandomBrick();
            }
        }
    }
    // 벽돌과의 충돌
    for (let r = 0; r < brickRowCount; r++) {
        for (let c = 0; c < brickColumnCount; c++) {
            const brick = bricks[r][c];
            if (brick && brick.status === 1) {
                if (ballX > brick.x && ballX < brick.x + brickWidth &&
                    ballY > brick.y && ballY < brick.y + brickHeight) {
                    ballSpeedY = -ballSpeedY;
                    if (brick === targetBrick) {
                        brick.status = 0;
                        createParticleEffect(brick.x + brickWidth/2, brick.y + brickHeight/2, 20, brick.color);
                        if (checkLevelComplete()) {
                            alert("레벨 클리어!");
                            startGame();
                            return;
                        }
                        // 다음 단어 선택은 여기서 하지 않음!
                    }
                    return;
                }
            }
        }
    }
}

// 무작위 벽돌 선택 함수
function selectRandomBrick() {
    console.log('무작위 벽돌 선택 시작');
    // 남아있는 벽돌 중 아래에 벽돌이 없는 것만 후보로
    const candidateBricks = [];
    for (let r = 0; r < brickRowCount; r++) {
        for (let c = 0; c < brickColumnCount; c++) {
            const brick = bricks[r][c];
            if (brick && brick.status === 1) {
                // 아래에 남아있는 벽돌이 있는지 확인
                let hasBelow = false;
                for (let rr = r + 1; rr < brickRowCount; rr++) {
                    if (bricks[rr][c] && bricks[rr][c].status === 1) {
                        hasBelow = true;
                        break;
                    }
                }
                if (!hasBelow) {
                    candidateBricks.push(brick);
                }
            }
        }
    }
    // 후보가 있으면 그 중에서 랜덤 선택
    if (candidateBricks.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidateBricks.length);
        targetBrick = candidateBricks[randomIndex];
        window.targetBrick = targetBrick;
        showWordPrompt(targetBrick);
    } else {
        // 예외: 후보가 없으면 기존 방식대로 전체에서 선택
        const activeBricks = [];
        for (let r = 0; r < brickRowCount; r++) {
            for (let c = 0; c < brickColumnCount; c++) {
                if (bricks[r][c] && bricks[r][c].status === 1) {
                    activeBricks.push(bricks[r][c]);
                }
            }
        }
        if (activeBricks.length > 0) {
            const randomIndex = Math.floor(Math.random() * activeBricks.length);
            targetBrick = activeBricks[randomIndex];
            window.targetBrick = targetBrick;
            showWordPrompt(targetBrick);
        } else {
            console.warn('선택할 수 있는 활성 벽돌이 없습니다!');
        }
    }
}

// 단어 프롬프트 표시 함수
function showWordPrompt(brick) {
    console.log('단어 프롬프트 함수 시작:', brick);
    
    if (!brick || !brick.word) {
        console.error('유효하지 않은 벽돌 데이터');
        return;
    }
    
    try {
        // 전역 변수에 brick 저장
        targetBrick = brick;
        window.targetBrick = brick;
        
        // 단어 표시 영역 업데이트
        document.getElementById('word-display').innerHTML = brick.word;
        
        // 프롬프트 표시 - 새 레이아웃에서는 display: none 대신 클래스만 제거
        const wordPromptEl = document.getElementById('word-prompt');
        wordPromptEl.classList.remove('hidden');
        
        // 디버그 영역에도 표시
        const debugEl = document.getElementById('current-word-debug');
        if (debugEl) debugEl.textContent = brick.word;
        
        // 공은 정지 상태로 유지
        ballInMotion = false;
        
        // 포커스 설정
        setTimeout(() => {
            const answerInput = document.getElementById('answer-input');
            if (answerInput) {
                answerInput.value = '';
                answerInput.focus();
            }
        }, 100);
        
        console.log('단어 프롬프트 표시 완료:', brick.word);
    } catch (error) {
        console.error('단어 프롬프트 표시 중 오류:', error);
    }
}

// 레벨 완료 체크 함수
function checkLevelComplete() {
    for (let r = 0; r < brickRowCount; r++) {
        for (let c = 0; c < brickColumnCount; c++) {
            if (bricks[r][c].status === 1) {
                return false;
            }
        }
    }
    return true;
}