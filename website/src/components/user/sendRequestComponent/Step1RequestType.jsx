import React from 'react';
import { Form, Select, Button } from 'antd';
const { Option } = Select;

export default function Step1RequestType({ form, onNext, formData }) {
    const requestTypes = [
        { value: 'LANDLORD_REQUEST', label: 'Yêu cầu quyền đăng tin (Chủ trọ)' },
        { value: 'FEEDBACK', label: 'Góp ý & phản hồi' },
        { value: 'BUG_REPORT', label: 'Báo lỗi hệ thống' },
        { value: 'FEATURE_REQUEST', label: 'Đề xuất tính năng mới' },
        { value: 'GENERAL', label: 'Khác / Liên hệ chung' },
    ];

    const handleFinish = (values) => {
        onNext(values);
    };

    return (
        <Form
            layout="vertical"
            form={form}
            onFinish={handleFinish}
            initialValues={formData}
            className="space-y-4 animate-fadeIn"
        >
            <Form.Item
                name="type"
                label="Loại yêu cầu"
                rules={[{ required: true, message: 'Vui lòng chọn loại yêu cầu!' }]}
            >
                <Select placeholder="Chọn loại yêu cầu" size="large">
                    {requestTypes.map((r) => (
                        <Option key={r.value} value={r.value}>{r.label}</Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item className="mb-0">
                <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    className="w-full rounded-lg h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                    Tiếp theo
                </Button>
            </Form.Item>
        </Form>
    );
}
