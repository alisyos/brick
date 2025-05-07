#!/bin/bash

echo "어휘 벽돌깨기 게임 설치 및 실행 스크립트"
echo "======================================"

# 필요한 패키지 설치
echo "필요한 패키지를 설치하는 중..."
npm install

# 환경 변수 파일 설정
if [ ! -f .env ]; then
  echo "환경 변수 파일(.env)을 생성합니다."
  echo "OpenAI API 키를 입력하세요:"
  read api_key
  echo "PORT=3000" > .env
  echo "OPENAI_API_KEY=$api_key" >> .env
  echo "환경 변수 파일이 생성되었습니다."
else
  echo "환경 변수 파일(.env)이 이미 존재합니다."
fi

# 서버 시작
echo "서버를 시작합니다..."
npm start 