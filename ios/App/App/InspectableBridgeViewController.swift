import Capacitor
import WebKit

class InspectableBridgeViewController: CAPBridgeViewController {
    override open func viewDidLoad() {
        super.viewDidLoad()

        if #available(iOS 16.4, *) {
            bridge?.webView?.isInspectable = true
        }
    }
}
