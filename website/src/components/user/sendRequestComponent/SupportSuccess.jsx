import React from 'react';
import { Button } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

export default function SupportSuccess({ onClose }) {
    return (
        <div className="text-center" style={{ padding: '40px 20px' }}>
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircleOutlined className="text-5xl text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Thành công!</h2>
            <p className="text-gray-600">Yêu cầu hỗ trợ của bạn đã được gửi thành công.</p>
            <p className="text-gray-500 mt-2 mb-6">Chúng tôi sẽ phản hồi trong vòng 24 giờ.</p>
            {onClose && (
                <Button 
                    type="primary" 
                    size="large" 
                    onClick={onClose}
                    style={{ background: 'linear-gradient(135deg, #e06a1a 0%, #ff8c42 100%)', border: 'none' }}
                >
                    Đóng
                </Button>
            )}
        </div>
    );
}
