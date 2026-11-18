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
import {
  Star,
  MessageSquare,
  CornerDownRight,
  Send,
  MessageCircle,
} from 'lucide-react';
import tenantService from '../../services/tenant.service';
import { formatDateTime } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';
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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <Title level={4} className="!mb-0.5 !font-bold !text-slate-900 !tracking-tight">
            Guest Feedback & Reputation
          </Title>
          <Text className="text-slate-500 text-xs block">
            Monitor customer ratings, dish quality reviews, and post official responses
          </Text>
        </div>
      </div>

      {/* Rating Scorecard */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="rounded-xl shadow-xs border border-slate-200/80 text-center py-4 bg-slate-50/60">
            <h1 className="text-4xl font-bold font-mono text-slate-900 mb-1">
              {summary?.avgRating ? summary.avgRating.toFixed(1) : '5.0'}
            </h1>
            <div className="flex justify-center mb-2">
              <Rate disabled allowHalf value={summary?.avgRating || 5} className="text-amber-500 text-base" />
            </div>
            <p className="text-slate-500 text-xs">
              Based on {summary?.totalReviews || reviews.length} verified guest dining sessions
            </p>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card className="rounded-xl shadow-xs border border-slate-200/80 bg-white">
            <h4 className="font-semibold text-slate-900 text-xs mb-3 uppercase tracking-wider">
              Rating Distribution
            </h4>
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
                const total = summary?.totalReviews || reviews.length || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="w-12 text-slate-500 text-[11px] font-mono flex items-center gap-1">
                      <span>{stars}</span>
                      <Star size={11} className="text-amber-500 fill-amber-500" />
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right text-slate-400 text-[11px] font-mono">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Review Feed */}
      <Card
        title={<span className="font-semibold text-slate-900 text-sm">Verified Guest Reviews ({reviews.length})</span>}
        className="rounded-xl shadow-xs border border-slate-200/80 bg-white"
      >
        <List
          dataSource={reviews}
          loading={loading}
          locale={{
            emptyText: (
              <EmptyState
                title="No guest reviews yet"
                description="Guests who complete table orders can rate dishes and leave feedback on their order confirmation screen."
                icon={MessageSquare}
              />
            ),
          }}
          renderItem={(item) => (
            <List.Item className="!py-4 border-b border-slate-100 last:border-b-0">
              <div className="w-full space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-xs">
                      {item.customerName || 'Verified Guest'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <Rate disabled value={item.overallRating} className="text-amber-500 text-xs" />
                  </div>
                  <span className="text-slate-400 text-[11px]">{formatDateTime(item.createdAt)}</span>
                </div>

                {item.comment && (
                  <p className="text-slate-700 text-xs leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{item.comment}"
                  </p>
                )}

                {/* Sub ratings */}
                <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 pt-1">
                  <span>Food Quality: <strong className="text-slate-800">{item.foodRating || 5}/5</strong></span>
                  <span>Service: <strong className="text-slate-800">{item.serviceRating || 5}/5</strong></span>
                  {item.orderNumber && (
                    <span className="font-mono text-slate-400">Order: #{item.orderNumber}</span>
                  )}
                </div>

                {/* Owner Reply */}
                {item.response ? (
                  <div className="mt-2.5 pl-3 border-l-2 border-emerald-700 py-1 bg-emerald-50/50 rounded-r-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px] mb-0.5">
                      <CornerDownRight size={13} strokeWidth={2.5} />
                      <span>Response from Management</span>
                    </div>
                    <p className="text-slate-700 text-xs">{item.response.message}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Replied on {formatDateTime(item.response.respondedAt)}
                    </span>
                  </div>
                ) : (
                  <div className="pt-1">
                    <Button
                      size="small"
                      icon={<MessageSquare size={12} strokeWidth={2} />}
                      onClick={() => {
                        setSelectedReview(item);
                        setReplyText('');
                        setReplyModalOpen(true);
                      }}
                      className="rounded-md text-[11px] border-slate-200 text-slate-600"
                    >
                      Post Official Reply
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
        title={<span className="font-semibold text-slate-900 text-sm">Respond to Guest Feedback</span>}
        open={replyModalOpen}
        onCancel={() => setReplyModalOpen(false)}
        onOk={handlePostReply}
        okText="Publish Response"
        okButtonProps={{ style: { backgroundColor: '#386b58', borderColor: '#386b58' }, className: 'rounded-lg text-xs font-medium' }}
        cancelButtonProps={{ className: 'rounded-lg text-xs' }}
        width={480}
      >
        <div className="mt-3 space-y-3">
          <p className="text-xs text-slate-500">
            Your reply will be displayed publicly under the guest's review on their feedback screen.
          </p>
          <Input.TextArea
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Thank you for dining with us! We are thrilled you enjoyed the food..."
            className="rounded-lg text-xs"
          />
        </div>
      </Modal>
    </div>
  );
};

export default ReviewManagement;
