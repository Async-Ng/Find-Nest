import React from 'react';
import { Card, Tag, Button, Checkbox } from 'antd';

export default function Step3ConfirmSubmit({ formData, fileList, onSubmit, onBack, loading }) {
    const getRequestTypeLabel = (type) => {
        const map = {
            LANDLORD_REQUEST: 'Yêu cầu quyền đăng tin (Chủ trọ)',
            FEEDBACK: 'Góp ý & phản hồi',
            BUG_REPORT: 'Báo lỗi hệ thống',
            FEATURE_REQUEST: 'Đề xuất tính năng mới',
            GENERAL: 'Khác / Liên hệ chung',
        };
        return map[type] || type;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <Card className="rounded-xl shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Xác nhận thông tin</h3>
                <div className="space-y-3">
                    <div className="flex justify-between border-b py-2">
                        <span className="text-gray-600 font-medium">Loại yêu cầu:</span>
                        <Tag color="blue">{getRequestTypeLabel(formData.type)}</Tag>
                    </div>
                    <div className="border-b py-2">
                        <span className="text-gray-600 font-medium block mb-1">Tiêu đề:</span>
                        <span className="font-semibold">{formData.subject}</span>
                    </div>
                    <div className="py-2">
                        <span className="text-gray-600 font-medium block mb-1">Nội dung:</span>
                        <p className="text-gray-700">{formData.message}</p>
                    </div>
                    {fileList.length > 0 && (
                        <div className="py-2">
                            <span className="text-gray-600 font-medium block mb-1">Tệp đính kèm:</span>
                            {fileList.map((f, i) => (
                                <Tag key={i} color="green">{f.name}</Tag>
                            ))}
                        </div>
                    )}
                </div>
            </Card>


            <div className="flex gap-3">
                <Button onClick={onBack} size="large" className="flex-1">Quay lại</Button>
                <Button
                    type="primary"
                    onClick={onSubmit}
                    loading={loading}
                    size="large"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                    {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </Button>
            </div>
        </div>
    );
}
