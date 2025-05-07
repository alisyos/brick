const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// CORS 설정 구체화
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST'],
  credentials: true
};

// 미들웨어
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 서버 상태 확인용 엔드포인트
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: '서버가 정상적으로 실행 중입니다.' });
});

// API 라우트: 단어 생성
app.post('/api/vocabulary', async (req, res) => {
  try {
    console.log('단어 요청 받음:', req.body);
    const { topic } = req.body;
    
    if (!OPENAI_API_KEY) {
      console.error('API 키가 설정되지 않았습니다.');
      return res.status(500).json({ 
        success: false,
        error: 'API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 추가해주세요.' 
      });
    }
    
    const topics = {
      math: "대한민국 중학생 수준을 고려하여, 수학 용어와 그 정의를 다음 난이도별로 각 5개씩 제공해주세요: 쉬움, 중간, 어려움",
      science: "대한민국 중학생 수준을 고려하여, 과학 용어와 그 정의를 다음 난이도별로 각 5개씩 제공해주세요: 쉬움, 중간, 어려움",
      english: "대한민국 중학생 수준을 고려하여, 영어 단어와 그 한국어 의미를 다음 난이도별로 각 5개씩 제공해주세요: 쉬움, 중간, 어려움",
      history: "대한민국 중학생 수준을 고려하여, 역사 용어와 그 정의를 다음 난이도별로 각 5개씩 제공해주세요: 쉬움, 중간, 어려움"
    };

    const prompt = topics[topic] || topics.math;
    console.log('사용 프롬프트:', prompt);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            { 
              role: 'system', 
              content: '당신은 주어진 주제에 맞는 용어와 정의를 JSON 형식으로 제공하는 도우미입니다. 응답은 반드시 다음 형식의 JSON만 포함해야 하며, 어떤 설명도 포함하지 마세요: [[{"word": "단어1", "definition": "정의1"}, ...], [{"word": "단어2", "definition": "정의2"}, ...], [{"word": "단어3", "definition": "정의3"}, ...]]' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          timeout: 30000 // 30초 타임아웃
        }
      );

      const content = response.data.choices[0].message.content;
      console.log('GPT 응답 전체 내용:');
      console.log('----------------------------------------');
      console.log(content);
      console.log('----------------------------------------');
      
      let jsonMatch = content.match(/\[\s*\[\s*\[.*?\]\s*\]\s*\]/s);
      
      if (jsonMatch) {
        const vocabularyData = JSON.parse(jsonMatch[0]);
        console.log('JSON 파싱 성공');
        console.log('vocabularyData 구조:');
        console.log(JSON.stringify(vocabularyData, null, 2));
        return res.json({ success: true, data: vocabularyData });
      } else {
        console.error('JSON 파싱 실패:', content);
        // JSON 형식이 아닌 경우, 직접 파싱 시도
        console.log('직접 파싱 시도...');
        try {
          // 텍스트에서 대괄호로 감싸진 부분 찾기
          let modifiedContent = content.replace(/```json|```/g, '').trim();
          if (modifiedContent.includes('[') && modifiedContent.includes(']')) {
            console.log('JSON 형식으로 보이는 내용 찾음');
            const jsonStart = modifiedContent.indexOf('[');
            const jsonEnd = modifiedContent.lastIndexOf(']') + 1;
            const jsonString = modifiedContent.substring(jsonStart, jsonEnd);
            
            const parsedData = JSON.parse(jsonString);
            console.log('수동 파싱 성공:');
            console.log(JSON.stringify(parsedData, null, 2));
            return res.json({ success: true, data: parsedData });
          }
        } catch (parseError) {
          console.error('수동 파싱 실패:', parseError);
        }
        
        return res.status(500).json({ 
          success: false,
          error: 'GPT 응답에서 JSON을 파싱하는데 실패했습니다.' 
        });
      }
    } catch (openaiError) {
      console.error('OpenAI API 호출 오류:', openaiError.message);
      // OpenAI API 오류 시 기본 데이터 반환
      const defaultData = require('./defaultVocabulary.js');
      console.log('기본 데이터 사용:');
      console.log(JSON.stringify(defaultData, null, 2));
      return res.json({
        success: true,
        data: defaultData, // 기본 어휘 데이터
        fromDefault: true
      });
    }
  } catch (error) {
    console.error('서버 오류 발생:', error);
    res.status(500).json({ 
      success: false,
      error: '서버 오류가 발생했습니다.' + (error.message ? ` (${error.message})` : '') 
    });
  }
});

// API 라우트: 정답 확인
app.post('/api/check-answer', async (req, res) => {
  try {
    console.log('정답 확인 요청 받음:', req.body);
    const { word, definition, userAnswer } = req.body;
    
    if (!OPENAI_API_KEY) {
      console.error('API 키가 설정되지 않았습니다.');
      return res.status(500).json({ 
        success: false,
        error: 'API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 추가해주세요.' 
      });
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            { 
              role: 'system', 
              content: '당신은 단어의 정의가 올바른지 판단하는 도우미입니다. 사용자의 답변과 실제 정의를 비교하여 의미적으로 일치하는지 확인하고, 그 이유를 간단히 설명해주세요.' 
            },
            { 
              role: 'user', 
              content: `단어: "${word}", 실제 정의: "${definition}", 사용자 입력: "${userAnswer}". 사용자의 답변이 의미적으로 올바른가요? JSON 형식으로 {"correct": true/false, "explanation": "간단한 설명"}으로 응답하세요.` 
            }
          ],
          temperature: 0
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          timeout: 30000 // 30초 타임아웃
        }
      );

      const content = response.data.choices[0].message.content;
      console.log('GPT 응답 받음:', content);
      const jsonMatch = content.match(/{.*}/s);
      
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        console.log('정답 판단 결과:', result);
        return res.json({ 
          success: true, 
          isCorrect: result.correct,
          explanation: result.explanation || '정답 여부를 판단했습니다.'
        });
      }
      
      // JSON 파싱 실패 시 정확한 일치 여부로 판단
      const isExactMatch = userAnswer.toLowerCase() === definition.toLowerCase();
      console.log('정확한 일치 여부로 판단:', isExactMatch);
      return res.json({ 
        success: true, 
        isCorrect: isExactMatch,
        explanation: isExactMatch ? '입력하신 정의가 정확히 일치합니다.' : '입력하신 정의가 정확히 일치하지 않습니다.'
      });
    } catch (openaiError) {
      console.error('OpenAI API 호출 오류:', openaiError.message);
      // OpenAI API 오류 시 정확한 일치 여부로 판단
      const isExactMatch = userAnswer.toLowerCase() === definition.toLowerCase();
      return res.json({ 
        success: true, 
        isCorrect: isExactMatch,
        explanation: '(AI 응답 오류로 인한 로컬 확인) ' + (isExactMatch ? '입력하신 정의가 정확히 일치합니다.' : '입력하신 정의가 정확히 일치하지 않습니다.')
      });
    }
  } catch (error) {
    console.error('서버 오류 발생:', error);
    // 서버 오류 시 정확한 일치 여부로 판단
    const isExactMatch = req.body.userAnswer.toLowerCase() === req.body.definition.toLowerCase();
    res.json({ success: true, isCorrect: isExactMatch });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 시작되었습니다: http://localhost:${PORT}`);
  console.log(`API 엔드포인트: http://localhost:${PORT}/api/status`);
}); 