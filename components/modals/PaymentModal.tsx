"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Button, Typography, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined, PhoneOutlined, ScissorOutlined, ShoppingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";

const { Text, Title } = Typography;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  paymentToEdit?: any;
}

import { getBillingCatalog } from '@/lib/actions/payment';

export const PaymentModal = ({ isOpen, onClose, onSave, paymentToEdit }: PaymentModalProps) => {
  const [form] = Form.useForm();
  const [mounted, setMounted] = useState(false);
  
  // --- New States for Confirmation Modal ---
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [barbersList, setBarbersList] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const fetchCatalog = async () => {
      const res = await getBillingCatalog();
      if (res.success && res.data) {
        setCatalog(res.data);
        if (res.staff) setBarbersList(res.staff);
      }
    };
    fetchCatalog();
  }, []);

  // Watch the items array to calculate the total amount and filter dropdowns in real-time
  const items = Form.useWatch('items', form) || [];
  
  const totalAmount = React.useMemo(() => {
    return items.reduce((sum: number, item: any) => sum + (item?.price || 0), 0) || 0;
  }, [items]);

  const hasService = items.some((item: any) => item?.type === 'Service');

  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      if (paymentToEdit) {
        form.setFieldsValue({
          ...paymentToEdit,
          date: paymentToEdit.date ? dayjs(paymentToEdit.date) : dayjs(),
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          date: dayjs(),
          method: 'Cash',
          items: [{ name: undefined, type: 'Service', price: 0 }],
          id: `INV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
        });
      }
    }
  }, [isOpen, paymentToEdit, form]);

  // Step 1: Validate form, then open the Confirmation Modal instead of saving immediately
  const handleOk = () => {
    form.validateFields().then((values) => {
      setPendingValues(values);
      setIsConfirmOpen(true);
    }).catch(info => {
      console.log('Validate Failed:', info);
    });
  };

  // Step 2: Actually save the data when user clicks "Yes" on the Confirmation Modal
  const handleFinalConfirm = () => {
    if (!pendingValues) return;

    const formattedData = {
      ...paymentToEdit, // Keep original hidden fields like bookingId
      ...pendingValues,
      amount: totalAmount, 
      date: pendingValues.date ? pendingValues.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      key: paymentToEdit ? paymentToEdit.key : Date.now().toString(), 
    };
    
    setIsConfirmOpen(false);
    setPendingValues(null);
    onSave(formattedData); // This triggers the save and opens the print invoice modal from the parent
  };

  // AUTO-FILL LOGIC
  const handleItemSelect = (selectedValue: string, fieldNameIndex: number) => {
    const selectedItem = catalog.find(item => item.value === selectedValue);
    if (selectedItem) {
      const currentItems = form.getFieldValue('items');
      currentItems[fieldNameIndex] = {
        ...currentItems[fieldNameIndex],
        name: selectedItem.label,
        type: selectedItem.type,
        price: selectedItem.price
      };
      form.setFieldsValue({ items: currentItems });
    }
  };

  // CLEAR LOGIC
  const handleTypeChange = (fieldNameIndex: number) => {
    const currentItems = form.getFieldValue('items');
    if (currentItems[fieldNameIndex]) {
      currentItems[fieldNameIndex].name = undefined;
      currentItems[fieldNameIndex].price = 0;
      form.setFieldsValue({ items: currentItems });
    }
  };

  if (!mounted) return null;

  return (
    <>
      <Modal
        title={paymentToEdit ? "Edit Payment" : "New Billing Entry"}
        open={isOpen}
        onOk={handleOk}
        onCancel={onClose}
        width={750}
        okText="Confirm & Print Bill"
        okButtonProps={{ style: { backgroundColor: '#7C4DFF', height: '40px' } }}
        centered
        forceRender
        destroyOnHidden // FIX: Changed from destroyOnClose to destroyOnHidden
      >
        <Form form={form} layout="vertical" className="mt-4">
          
          <Form.Item name="id" hidden><Input /></Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="client" label="Client Name" rules={[{ required: true, message: 'Required' }]}>
                <Input prefix={<UserOutlined className="text-slate-400" />} placeholder="Ex: Kamal Perera" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="contact" label="Contact Number" rules={[{ required: true, message: 'Required' }]}>
                <Input prefix={<PhoneOutlined className="text-slate-400" />} placeholder="077xxxxxxx" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                {/* Date is read-only and always current */}
                <DatePicker className="w-full" format="YYYY-MM-DD" size="large" disabled />
              </Form.Item>
            </Col>
            {hasService && (
              <Col xs={24} sm={12}>
                <Form.Item name="barber" label="Select Barber" rules={[{ required: true, message: 'Required' }]}>
                  <Select placeholder="Choose specialist" size="large">
                    {/* Map DB barbers directly */}
                    {barbersList.map(b => (
                      <Select.Option key={b.id} value={b.name}>{b.name}</Select.Option>
                    ))}
                    {/* In case an old deleted barber is attached to edit */}
                    {paymentToEdit?.barber && !barbersList.find(b => b.name === paymentToEdit.barber) && (
                      <Select.Option key={paymentToEdit.barber} value={paymentToEdit.barber}>{paymentToEdit.barber}</Select.Option>
                    )}
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          <div className="text-xs uppercase font-bold text-slate-400 border-b border-slate-200 pb-2 mb-4 mt-2">
            Services & Products
          </div>
          
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => {
                  const currentType = items[name]?.type || 'Service';
                  const filteredCatalog = catalog.filter(item => item.type === currentType);

                  return (
                    <div key={key} className="bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl mb-3 border border-slate-200 md:border-none">
                      <div className="flex flex-col md:flex-row gap-2 md:gap-3 items-start md:items-center w-full">
                        
                        <div className="flex gap-2 w-full md:flex-1">
                          <Form.Item {...restField} name={[name, 'type']} rules={[{ required: true }]} className="mb-0 w-[110px] shrink-0">
                            <Select size="large" onChange={() => handleTypeChange(name)}>
                              <Select.Option value="Service">Service</Select.Option>
                              <Select.Option value="Product">Product</Select.Option>
                            </Select>
                          </Form.Item>
                          
                          <Form.Item {...restField} name={[name, 'name']} className="mb-0 flex-1" rules={[{ required: true, message: 'Select item' }]}>
                            <Select
                              showSearch
                              placeholder={`Search...`}
                              size="large"
                              options={filteredCatalog}
                              onChange={(val) => handleItemSelect(val, name)}
                              allowClear
                              className="w-full"
                              popupMatchSelectWidth={false}
                            />
                          </Form.Item>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto items-center justify-between md:justify-start">
                          <Form.Item {...restField} name={[name, 'price']} rules={[{ required: true, message: 'Price missing' }]} className="mb-0 flex-1 md:w-[130px] md:flex-none">
                            <InputNumber placeholder="Price" min={0} size="large" prefix="Rs." className="w-full" />
                          </Form.Item>
                          
                          <div className="w-[32px] flex justify-center shrink-0">
                            {fields.length > 1 && (
                              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
                
                <div className="flex gap-2 mb-4 mt-2">
                  <Button type="dashed" onClick={() => add({ type: 'Service', name: undefined, price: 0 })} icon={<ScissorOutlined />}>
                    Add Service
                  </Button>
                  <Button type="dashed" onClick={() => add({ type: 'Product', name: undefined, price: 0 })} icon={<ShoppingOutlined />}>
                    Add Product
                  </Button>
                </div>
              </>
            )}
          </Form.List>

          <Row className="mt-4">
            <Col xs={24} sm={12}>
              <Form.Item name="method" label="Payment Method">
                <Select size="large">
                  <Select.Option value="Cash">Cash</Select.Option>
                  <Select.Option value="Card">Card</Select.Option>
                  <Select.Option value="Transfer">Transfer</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-200 mt-2">
            <Text strong className="text-lg">Total Amount</Text>
            <Title level={3} style={{ margin: 0, color: '#7C4DFF' }}>Rs. {totalAmount.toLocaleString()}</Title>
          </div>
        </Form>
      </Modal>

      {/* --- The Intercepting Confirmation Modal --- */}
      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleFinalConfirm}
        title="Finalize Billing?"
        description="Are you sure you want to finalize this transaction? Once confirmed, the bill will be recorded and printed."
        confirmText="Yes, Print Bill"
        cancelText="Cancel"
      />
    </>
  );
};