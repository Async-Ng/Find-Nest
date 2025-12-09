import React from 'react';
import { Form, Input, Button, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
const { TextArea } = Input;
const { Dragger } = Upload;

export default function Step2RequestDetails({ form, onNext, onBack, fileList, setFileList, formData }) {


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
                name="subject"
                label="Tiêu đề"
                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề yêu cầu!' }]}
            >
                <Input placeholder="Ví dụ: Yêu cầu quyền đăng tin" size="large" />
            </Form.Item>

            <Form.Item
                name="message"
                label="Nội dung chi tiết"
                rules={[{ required: true, message: 'Vui lòng nhập nội dung chi tiết!' }]}
            >
                <TextArea rows={6} placeholder="Mô tả chi tiết yêu cầu của bạn..." />
            </Form.Item>


            <div className="flex gap-3">
                <Button onClick={onBack} size="large" className="flex-1">Quay lại</Button>
                <Button type="primary" htmlType="submit" size="large" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    Tiếp theo
                </Button>
            </div>
        </Form>
    );
}
