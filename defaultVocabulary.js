// 기본 단어 데이터 (OpenAI API 호출 실패 시 사용)
module.exports = [
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