import { useEffect, useState } from 'react';
import {
  Card,
  Rate,
  Typography,
  Row,
  Col,
  List,
  Button,
  Modal,
  Input,
  Tag,
} from 'antd';
import { StarFilled, MessageOutlined } from '@ant-design/icons';
import tenantService from '../../services/tenant.service';
import { formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await tenantService.getReviews();
      setReviews(res.data?.reviews || []);
      setSummary(res.data?.summary || null);
    } catch {
      toast.error('Failed to load guest reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handlePostReply = async () => {
    if (!replyText.trim()) {
      toast.error('Please write a reply');
      return;
    }
    try {
      await tenantService.replyReview(selectedReview._id, { reply: replyText });
      toast.success('Your response has been published');
      setReplyModalOpen(false);
      setReplyText('');
      loadReviews();
    } catch {
      toast.error('Failed to post reply');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <Title level={4} className="!mb-0 !font-extrabold !text-slate-900">
          Guest Feedback & Reputation
        </Title>
        <Text className="text-slate-500 text-xs mt-0.5 block">
          Analyze customer ratings, food satisfaction, and respond directly to guest reviews
        </Text>
      </div>

      {/* Rating Scorecard */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="rounded-2xl shadow-sm border border-slate-100 text-center py-4 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <h1 className="text-5xl font-black text-amber-500 mb-2">
              {summary?.avgRating ? summary.avgRating.toFixed(1) : '5.0'}
            </h1>
            <Rate disabled allowHalf value={summary?.avgRating || 5} className="text-amber-400 text-lg mb-2" />
            <p className="text-slate-500 text-xs font-semibold">
              Based on {summary?.totalReviews || reviews.length} verified dining experiences
            </p>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card className="rounded-2xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm mb-4">Rating Breakdown</h4>
            <div className="space-y-2 text-xs">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count =
                  stars === 5
                    ? summary?.fiveStar || 0
                    : stars === 4
                    ? summary?.fourStar || 0
                    : stars === 3
                    ? summary?.threeStar || 0
                    : stars === 2
                    ? summary?.twoStar || 0
                    : summary?.oneStar || 0;
                const total = summary?.totalReviews || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="w-12 text-slate-600 font-semibold">{stars} Stars</span>
                    <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-slate-400 text-[11px]">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Review List */}
      <Card
        title={<span className="font-bold text-slate-800 text-sm">Customer Reviews</span>}
        className="rounded-2xl shadow-sm border border-slate-100"
      >
        <List
          loading={loading}
          dataSource={reviews}
          renderItem={(rev) => (
            <List.Item className="!py-4">
              <div className="w-full space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-800 text-sm">{rev.customerName || 'Guest'}</span>
                    <span className="text-slate-400 text-xs ml-3">{formatDateTime(rev.createdAt)}</span>
                  </div>
                  <Rate disabled value={rev.overallRating} className="text-amber-400 text-sm" />
                </div>

                <div className="flex gap-4 text-xs text-slate-500">
                  {rev.foodRating && <span>Food: <strong>{rev.foodRating}/5</strong></span>}
                  {rev.serviceRating && <span>Service: <strong>{rev.serviceRating}/5</strong></span>}
                </div>

                <p className="text-slate-700 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{rev.comment || 'No written comment.'}"
                </p>

                {rev.ownerReply ? (
                  <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100/60 text-xs ml-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag color="indigo" className="text-[10px] font-bold">RESTAURANT RESPONSE</Tag>
                      <span className="text-slate-400 text-[11px]">{formatDateTime(rev.ownerRepliedAt)}</span>
                    </div>
                    <p className="text-slate-800">{rev.ownerReply}</p>
                  </div>
                ) : (
                  <div className="flex justify-end pt-1">
                    <Button
                      size="small"
                      icon={<MessageOutlined />}
                      onClick={() => {
                        setSelectedReview(rev);
                        setReplyText('');
                        setReplyModalOpen(true);
                      }}
                      className="rounded-lg text-xs"
                    >
                      Respond to Review
                    </Button>
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
      </Card>

      {/* Reply Modal */}
      <Modal
        title={`Reply to ${selectedReview?.customerName || 'Guest'}`}
        open={replyModalOpen}
        onCancel={() => setReplyModalOpen(false)}
        onOk={handlePostReply}
        okText="Publish Response"
      >
        <div className="space-y-3 mt-4">
          <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl">
            "{selectedReview?.comment}"
          </p>
          <Input.TextArea
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Thank you so much for dining with us! We are thrilled you enjoyed the food..."
            className="rounded-xl"
          />
        </div>
      </Modal>
    </div>
  );
};

export default ReviewManagement;
