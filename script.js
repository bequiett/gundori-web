let updateInterval = null;
let serviceData = null;

// 계산하기 버튼 클릭 로직
function startCalculation() {
    const enlistmentInput = document.getElementById('enlistmentDate');
    const adjustmentType = document.getElementById('adjustmentType').value;
    const adjustmentMonths = parseInt(document.getElementById('adjustmentMonths').value) || 0;
    const adjustmentDays = parseInt(document.getElementById('adjustmentDays').value) || 0;
    
    if (!enlistmentInput.value) {
        alert('입영 일자 형식이 잘못되었습니다.');
        return;
    }

    const enlistmentDate = new Date(enlistmentInput.value);
    enlistmentDate.setHours(0, 0, 0, 0); // 군돌이 퍼센티지와 동일하게 표시하도록 0시 0분 0초로 통일
    
    // 전역일 계산(육군 18개월)
    const baseServiceMonths = 18;

    const dischargeDate = new Date(enlistmentDate);
    dischargeDate.setMonth(dischargeDate.getMonth() + baseServiceMonths);
    dischargeDate.setDate(dischargeDate.getDate() - 1);
    
    // 전역일 계산(사용자 조정)
    if (adjustmentType === 'plus') {
        dischargeDate.setMonth(dischargeDate.getMonth() + adjustmentMonths);
        dischargeDate.setDate(dischargeDate.getDate() + adjustmentDays);
    } else {
        dischargeDate.setMonth(dischargeDate.getMonth() - adjustmentMonths);
        dischargeDate.setDate(dischargeDate.getDate() - adjustmentDays);
    }
    
    dischargeDate.setHours(0, 0, 0, 0);

    // 전체 복무일 계산 (하루 더하기)
    const totalServiceDays = Math.ceil((dischargeDate - enlistmentDate) / (1000 * 60 * 60 * 24)) + 1;

    serviceData = {
        enlistmentDate: enlistmentDate,
        dischargeDate: dischargeDate,
        totalServiceDays: totalServiceDays,
        adjustmentInfo: {
            type: adjustmentType,
            months: adjustmentMonths,
            days: adjustmentDays
        }
    };

    updateServiceInfo();

    if (updateInterval) {
        clearInterval(updateInterval);
    }

    calculateAndUpdate();

    // 실시간 업데이트 시작
    updateInterval = setInterval(calculateAndUpdate, 10);
}

// 계산 결과 UI 업데이트 로직
function updateServiceInfo() {
    if (!serviceData) return;

    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };

    document.getElementById('enlistmentInfo').textContent = 
        serviceData.enlistmentDate.toLocaleDateString('ko-KR', options);

    document.getElementById('dischargeInfo').textContent = 
        serviceData.dischargeDate.toLocaleDateString('ko-KR', options);

    const { type, months, days } = serviceData.adjustmentInfo;
    if (months === 0 && days === 0) {
        document.getElementById('adjustmentInfo').textContent = '-';
    } else {
        const sign = type === 'plus' ? '+' : '-';
        const monthText = months > 0 ? `${months}개월` : '';
        const dayText = days > 0 ? `${days}일` : '';
        const adjustmentText = [monthText, dayText].filter(Boolean).join(' ');
        document.getElementById('adjustmentInfo').textContent = `${sign}${adjustmentText}`;
    }
}

// 복무율 실시간 계산 로직
function calculateAndUpdate() {
    if (!serviceData) return;

    const now = new Date();

    const servedMilliseconds = Math.max(0, now - serviceData.enlistmentDate);
    const remainingMilliseconds = Math.max(0, serviceData.dischargeDate - now);
    const totalMilliseconds = serviceData.dischargeDate - serviceData.enlistmentDate;

    const servedDaysRaw = Math.max(0, servedMilliseconds / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, remainingMilliseconds / (1000 * 60 * 60 * 24));

    const servedDays = Math.floor(servedDaysRaw) + 1;

    let percentage = (servedMilliseconds / totalMilliseconds) * 100;
    percentage = Math.min(100, Math.max(0, percentage));

    // UI에 계산 결과 반영
    updateDisplay({
        servedDays: servedDays,
        remainingDays: Math.ceil(remainingDays),
        percentage: percentage,
        isCompleted: remainingMilliseconds <= 0
    });
}

// 복무율 UI 실시간 업데이트 로직
function updateDisplay(data) {
    const progressFill = document.getElementById('progressFill');
    
    progressFill.style.width = data.percentage + '%';
    progressFill.textContent = data.percentage.toFixed(7) + '%';

    document.getElementById('remainingDays').textContent = data.remainingDays.toLocaleString();
    document.getElementById('totalDays').textContent = serviceData.totalServiceDays.toLocaleString();
    document.getElementById('servedDays').textContent = data.servedDays.toLocaleString();

    // 전역 완료 시 업데이트 중지
    if (data.isCompleted) {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }
}

// 페이지 로드 시 초기 설정
window.addEventListener('load', function() {
    // 윈도우 크기 고정(앱 형태로 사용 시 적용)
    window.resizeTo(1050, 600);
    window.addEventListener('resize', function() {
        window.resizeTo(1050, 600);
    });
    
    const today = new Date();
    document.getElementById('enlistmentDate').max = today.toISOString().split('T')[0];
});

// 페이지 언로드 시 인터벌 중지
window.addEventListener('beforeunload', function() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});