import React, { useState } from 'react';
import { Modal, Steps, message } from 'antd';
import Step1RequestType from './sendRequestComponent/Step1RequestType';
import Step2RequestDetails from './sendRequestComponent/Step2RequestDetails';
import Step3ConfirmSubmit from './sendRequestComponent/Step3ConfirmSubmit';
import SupportSuccess from './sendRequestComponent/SupportSuccess';
import { userApi } from '../../services/api';

export default function RequestModal({ open, onClose }) {
  const [formData, setFormData] = useState({});
  const [fileList, setFileList] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      title: formData.type ? getRequestTypeLabel(formData.type) : 'Loại yêu cầu'
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
      const { subject, message: msg, type } = formData;
      const result = await userApi.submitRequest(subject, msg, type);

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

  const handleClose = () => {
    setFormData({});
    setFileList([]);
    setCurrent(0);
    setSuccess(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={700}
      centered
      styles={{
        mask: { backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(4px)' }
      }}
      style={{ top: 20 }}
    >
      {success ? (
        <SupportSuccess onClose={handleClose} />
      ) : (
        <div style={{ padding: '16px 32px 32px 32px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '20px', textAlign: 'center' }}>
            Gửi yêu cầu hỗ trợ
          </h2>
          <Steps current={current} items={steps} style={{ marginBottom: '24px' }} />
          <div>
            {current === 0 && (
              <Step1RequestType onNext={handleNext} formData={formData} />
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
        </div>
      )}
    </Modal>
  );
}
