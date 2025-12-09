import React, { useState } from 'react';
import { Steps, Card, message } from 'antd';
import Step1RequestType from '../../components/user/sendRequestComponent/Step1RequestType';
import Step2RequestDetails from '../../components/user/sendRequestComponent/Step2RequestDetails';
import Step3ConfirmSubmit from '../../components/user/sendRequestComponent/Step3ConfirmSubmit';
import SupportSuccess from '../../components/user/sendRequestComponent/SupportSuccess';
import { userApi } from '../../services/api'
export default function SupportRequestPage() {
  const [formData, setFormData] = useState({});
  const [fileList, setFileList] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const COLORS = {
    primary: '#5ba9d3',
    primaryLight: '#e8f4f8',
    primaryDark: '#4a8fb5',
    secondary: '#7bc4e0',
    white: '#FFFFFF',
    gray: '#F8F9FA',
    border: '#E0E6ED',
    text: '#2D3748',
    textLight: '#718096'
  };

  const getRequestTypeLabel = (type) => {
    const map = {
      LANDLORD_REQUEST: 'Yêu cầu quyền đăng tin (Chủ trọ)',
      FEEDBACK: 'Góp ý & phản hồi',
      BUG_REPORT: 'Báo lỗi hệ thống',
      FEATURE_REQUEST: 'Đề xuất tính năng mới',
      GENERAL: 'Khác / Liên hệ chung',
    };
    return map[type] || 'Loại yêu cầu';
  };
  const steps = [
    {
      title: formData.type
        ? getRequestTypeLabel(formData.type)
        : 'Loại yêu cầu'
    },
    { title: 'Chi tiết' },
    { title: 'Xác nhận' },
  ];




  const handleNext = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrent(current + 1);
  };

  const handleBack = () => setCurrent(current - 1);


  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Lấy dữ liệu từ formData
      const { title, description, type } = formData;

      // Gọi API thật
      const result = await userApi.submitRequest(
        title,
        description,
        type // category
      );

      if (result.success) {
        message.success('Yêu cầu đã được gửi thành công!');
        setSuccess(true);
      } else {
        message.error(result.message || 'Gửi thất bại!');
      }
    } catch (e) {
      console.error(e);
      message.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };


  if (success) return <SupportSuccess />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-orange-100">
      {/* Header Section */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
        padding: '24px 0',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 4px 20px rgba(91, 169, 211, 0.2)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', textAlign: 'center', color: COLORS.white }}>
          <h1 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '16px', letterSpacing: '-1px' }}>
            Gửi yêu cầu hỗ trợ
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '0' }}>
            Chúng tôi sẵn sàng lắng nghe và hỗ trợ bạn
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        <Card style={{
          borderRadius: '24px',
          boxShadow: '0 4px 20px rgba(91, 169, 211, 0.1)',
          border: `1px solid ${COLORS.border}`
        }} className="p-8">
          <Steps current={current} items={steps} />
          <div className="mt-8">
            {current === 0 && (
              <Step1RequestType
                onNext={handleNext}
                formData={formData}
              />
            )}
            {current === 1 && (
              <Step2RequestDetails
                onNext={handleNext}
                onBack={handleBack}
                fileList={fileList}
                setFileList={setFileList}
                formData={formData}
              />
            )}
            {current === 2 && (
              <Step3ConfirmSubmit
                formData={formData}
                fileList={fileList}
                onSubmit={handleSubmit}
                onBack={handleBack}
                loading={loading}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
